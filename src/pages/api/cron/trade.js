import prisma from '../../../lib/db';

export default async function handler(req, res) {
    // Only allow POST requests (Vercel Cron uses POST or GET, typically GET but good to be explicit/standard)
    // Vercel Cron specifically sends GET requests by default unless configured, but let's support both or just GET.
    // However, for security, we should check for a secret key if not using Vercel's built-in protections.
    // For Vercel Cron, the request comes with specific headers.

    // Check Authorization header (Optional: set CRON_SECRET in env for security)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('Unauthorized cron attempt');
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log('Cron job triggered. Starting analysis cycle...');

    try {
        // 1. Check if global bot is running
        const state = await prisma.botState.findUnique({
            where: { id: 'global' }
        });

        if (!state?.isRunning) {
            return res.status(200).json({ success: true, message: 'Bot is stopped' });
        }

        // 2. Trigger Analysis
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const analyzeUrl = `${protocol}://${host}/api/trading/analyze`;

        // We call our own analyze endpoint internally
        // Note: In a real serverless env, direct function calls or shared logic library is better than HTTP loopback 
        // to avoid timeout loops, but for this architecture it simplifies reusing existing logic.
        const analyzeRes = await fetch(analyzeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: state.symbol, interval: '1h' })
        });

        const analysisData = await analyzeRes.json();

        if (!analysisData.success) {
            await prisma.analysisLog.create({
                data: {
                    type: 'error',
                    message: `Cron Analysis Failed: ${analysisData.error}`,
                    data: analysisData
                }
            });
            throw new Error(analysisData.error);
        }

        const decision = analysisData.data.decision;

        // 3. Log Decision
        await prisma.analysisLog.create({
            data: {
                type: 'decision',
                message: `Cron: ${decision.action} (${(decision.confidence * 100).toFixed(0)}%) - ${decision.reason || decision.reasoning}`,
                marketOutlook: decision.marketOutlook,
                confidence: decision.confidence,
                data: decision
            }
        });

        // 4. Auto-Execute Trade if criteria met
        if (decision.action !== 'HOLD' && decision.confidence > 0.75) {
            // Check current balances to prevent over-trading
            const balanceUrl = `${protocol}://${host}/api/account/balance`;
            const balanceRes = await fetch(balanceUrl);
            const balanceData = await balanceRes.json();
            const balances = balanceData.data?.balances || [];

            const baseAsset = state.symbol.replace('USDT', '');
            const baseBalance = balances.find(b => b.asset === baseAsset)?.total || 0;
            const usdtBalance = balances.find(b => b.asset === 'USDT')?.total || 0;

            let shouldTrade = false;
            if (decision.action === 'BUY' && baseBalance < 0.0001 && usdtBalance > 10) {
                // Only BUY if we don't already have a position and have enough USDT
                shouldTrade = true;
            } else if (decision.action === 'SELL' && baseBalance >= 0.001) {
                // Only SELL if we have enough of the asset
                shouldTrade = true;
            }

            if (shouldTrade) {
                // Execute
                const executeUrl = `${protocol}://${host}/api/trading/execute`;
                const tradeRes = await fetch(executeUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        symbol: state.symbol,
                        side: decision.action,
                        quantity: 0.001, // Fixed size
                    })
                });

                const tradeData = await tradeRes.json();

                if (tradeData.success) {
                    await prisma.analysisLog.create({
                        data: {
                            type: 'trade',
                            message: `Auto-Executed ${decision.action} at $${tradeData.data.price}`,
                            data: tradeData
                        }
                    });
                } else {
                    await prisma.analysisLog.create({
                        data: {
                            type: 'error',
                            message: `Trade Execution Failed: ${tradeData.error}`,
                            data: tradeData
                        }
                    });
                }
            } else {
                console.log(`Skipping ${decision.action}: balance constraints not met`, { baseBalance, usdtBalance });
            }
        }

        res.status(200).json({ success: true, decision });
    } catch (error) {
        console.error('Cron job error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ success: false, error: error.message });
    }
}
