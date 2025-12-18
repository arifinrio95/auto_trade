import prisma from '../../../lib/db';
import { BinanceClient } from '../../../lib/binance';
import { analyzeIndicators } from '../../../lib/indicators';
import { initializeGemini, generateAutoTradingDecision } from '../../../lib/gemini';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('Unauthorized cron attempt');
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log('Cron Portfolio Cycle Started...');

    try {
        // 1. Get Bot State
        const state = await prisma.botState.findUnique({ where: { id: 'global' } });
        if (!state?.isRunning) return res.status(200).json({ success: true, message: 'Bot stopped' });

        const client = new BinanceClient(process.env.BINANCE_API_KEY, process.env.BINANCE_SECRET_KEY);
        initializeGemini(process.env.GEMINI_API_KEY);

        // 2. Fetch Portfolio Status (Balances)
        const accountInfo = await client.getAccountInfo();
        const balances = accountInfo.balances
            .map(b => ({
                asset: b.asset,
                free: parseFloat(b.free),
                locked: parseFloat(b.locked),
                total: parseFloat(b.free) + parseFloat(b.locked)
            }))
            .filter(b => b.total > 0.00001); // Filter out dust

        // Identify "Open Positions" relative to our target symbol (e.g., BTC for BTCUSDT)
        const baseAsset = state.symbol.replace('USDT', '');
        const currentPosition = balances.find(b => b.asset === baseAsset);

        const openPositions = currentPosition ? [{
            symbol: state.symbol,
            asset: baseAsset,
            quantity: currentPosition.total,
            side: 'BUY', // In spot, holding means we bought
            timeOpen: 'Synced from wallet'
        }] : [];

        // 3. Fetch Market Data & Indicators
        const candles = await client.getKlines(state.symbol, '1h', 100);
        const ticker = await client.get24hTicker(state.symbol);
        const analysis = analyzeIndicators(candles);

        const marketData = {
            symbol: state.symbol,
            currentPrice: parseFloat(ticker.lastPrice),
            priceChangePercent: parseFloat(ticker.priceChangePercent),
            highPrice: parseFloat(ticker.highPrice),
            lowPrice: parseFloat(ticker.lowPrice),
            volume: parseFloat(ticker.volume),
        };

        // 4. Fetch Recent Trade History
        const tradeHistory = await prisma.trade.findMany({
            where: { symbol: state.symbol },
            orderBy: { time: 'desc' },
            take: 10
        });

        // 5. Ask Gemini for Portfolio Decision
        console.log(`Asking Gemini for decision on ${state.symbol} with ${openPositions.length} positions...`);
        const decision = await generateAutoTradingDecision(
            marketData,
            analysis.indicators,
            candles,
            openPositions,
            tradeHistory
        );

        // 6. Execute Decisions
        const logs = [];

        // A. Handle Position Actions (CLOSE)
        for (const action of (decision.positionActions || [])) {
            if (action.action === 'CLOSE') {
                const pos = openPositions.find(p => p.asset === action.asset);
                if (pos && pos.quantity > 0) {
                    console.log(`Gemini suggests CLOSING ${action.asset}. Executing SELL...`);
                    const orderRes = await client.placeMarketOrder(state.symbol, 'SELL', pos.quantity);

                    // Log to DB via execution logic (simplified here)
                    const avgPrice = parseFloat(orderRes.executedQty) > 0
                        ? parseFloat(orderRes.cummulativeQuoteQty) / parseFloat(orderRes.executedQty)
                        : parseFloat(orderRes.price);

                    await prisma.trade.create({
                        data: {
                            orderId: orderRes.orderId.toString(),
                            symbol: state.symbol,
                            side: 'SELL',
                            price: avgPrice,
                            quantity: parseFloat(orderRes.executedQty),
                            quoteQty: parseFloat(orderRes.cummulativeQuoteQty),
                            status: 'FILLED',
                            commission: 0,
                            commissionAsset: 'USDT'
                        }
                    });
                    logs.push(`Closed ${action.asset} position: ${action.reason}`);
                }
            }
        }

        // B. Handle New Orders
        if (decision.newOrder?.shouldOpen && decision.confidence > 0.6) {
            const side = decision.newOrder.side;
            const qty = decision.newOrder.quantity || 0.001;

            // Check if we already have a position to avoid double buy
            const canTrade = side === 'BUY' ? openPositions.length === 0 : true;

            if (canTrade) {
                console.log(`Executing new ${side} order for ${state.symbol}...`);
                const orderRes = await client.placeMarketOrder(state.symbol, side, qty);

                const avgPrice = parseFloat(orderRes.executedQty) > 0
                    ? parseFloat(orderRes.cummulativeQuoteQty) / parseFloat(orderRes.executedQty)
                    : parseFloat(orderRes.price);

                await prisma.trade.create({
                    data: {
                        orderId: orderRes.orderId.toString(),
                        symbol: state.symbol,
                        side: side,
                        price: avgPrice,
                        quantity: parseFloat(orderRes.executedQty),
                        quoteQty: parseFloat(orderRes.cummulativeQuoteQty),
                        status: 'FILLED',
                        commission: 0,
                        commissionAsset: 'USDT',
                        stopLoss: decision.newOrder.stopLoss ? parseFloat(decision.newOrder.stopLoss) : null,
                        takeProfit: decision.newOrder.takeProfit ? parseFloat(decision.newOrder.takeProfit) : null
                    }
                });
                logs.push(`Opened new ${side} order: ${decision.newOrder.reason} (TP: ${decision.newOrder.takeProfit}, SL: ${decision.newOrder.stopLoss})`);
            }
        }

        // 7. Final Logging
        await prisma.analysisLog.create({
            data: {
                type: 'decision',
                message: `Portfolio Decision: ${decision.overallStrategy}`,
                marketOutlook: decision.marketOutlook,
                confidence: decision.confidence,
                data: {
                    ...decision,
                    executionLogs: logs
                }
            }
        });

        res.status(200).json({ success: true, decision, logs });

    } catch (error) {
        console.error('Cron Portfolio Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
