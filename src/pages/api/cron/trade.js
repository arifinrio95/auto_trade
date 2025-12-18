import prisma from '../../../lib/db';

export default async function handler(req, res) {
    // Only allow POST requests (Vercel Cron uses POST or GET, typically GET but good to be explicit/standard)
    // Vercel Cron specifically sends GET requests by default unless configured, but let's support both or just GET.
    // However, for security, we should check for a secret key if not using Vercel's built-in protections.
    // For Vercel Cron, the request comes with specific headers.

    // Check Authorization header (Optional: set CRON_SECRET in env for security)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

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
                message: `Cron: ${decision.action} (${(decision.confidence * 100).toFixed(0)}%) - ${decision.reason}`,
                marketOutlook: decision.marketOutlook,
                confidence: decision.confidence,
                data: decision
            }
        });

        // 4. Auto-Execute Trade if criteria met
        if (decision.action !== 'HOLD' && decision.confidence > 0.7) {
            // SAFETY: Double check if we already really want to trade. 
            // In a real bot, we'd check current open positions here to avoid over-trading.

            // Execute
            const executeUrl = `${protocol}://${host}/api/trading/execute`;
            const tradeRes = await fetch(executeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: state.symbol,
                    side: decision.action,
                    quantity: decision.action === 'BUY' ? 0.001 : 0.001, // Fixed size for demo safety
                })
            });

            const tradeData = await tradeRes.json();

            if (tradeData.success) {
                await prisma.analysisLog.create({
                    data: {
                        type: 'trade',
                        message: `Auto-Executed ${decision.action}`,
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
        }

        res.status(200).json({ success: true, decision });
    } catch (error) {
        console.error('Cron job error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
