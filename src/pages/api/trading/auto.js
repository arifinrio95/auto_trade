import { BinanceClient } from '../../../lib/binance';
import { analyzeIndicators } from '../../../lib/indicators';
import { initializeGemini, generateAutoTradingDecision } from '../../../lib/gemini';
import prisma from '../../../lib/db';

export default async function handler(req, res) {
    const { method } = req;

    if (method === 'GET') {
        try {
            console.log('Database Access Debug: Attempting to fetch BotState...');
            // Get auto-trading status from DB
            const state = await prisma.botState.findUnique({
                where: { id: 'global' },
            }) || { isRunning: false, symbol: 'BTCUSDT', updatedAt: new Date() };

            console.log('Database Access Debug: Success', { isRunning: state.isRunning });

            const latestLog = await prisma.analysisLog.findFirst({
                where: { type: 'decision' },
                orderBy: { time: 'desc' },
            });

            // Get recent logs
            const logs = await prisma.analysisLog.findMany({
                take: 100,
                orderBy: { time: 'desc' },
            });

            const allTrades = await prisma.trade.findMany({
                orderBy: { time: 'asc' }
            });

            // Calculate Stats from DB
            let totalPnl = 0;
            let winCount = 0;
            let lossCount = 0;
            let inventory = [];

            allTrades.forEach(trade => {
                if (trade.side === 'BUY') {
                    inventory.push({ price: trade.price, qty: trade.quantity });
                } else {
                    let sellQty = trade.quantity;
                    let sellValue = trade.quoteQty;
                    let costBasis = 0;

                    // Simple FIFO cost basis
                    while (sellQty > 0 && inventory.length > 0) {
                        let batch = inventory[0];
                        let takeQty = Math.min(sellQty, batch.qty);
                        costBasis += takeQty * batch.price;
                        batch.qty -= takeQty;
                        sellQty -= takeQty;
                        if (batch.qty <= 0) inventory.shift();
                    }

                    const pnl = sellValue - costBasis;
                    totalPnl += pnl;
                    if (pnl > 0) winCount++;
                    else if (pnl < 0) lossCount++;
                }
            });

            const totalTrades = allTrades.length;
            const winRate = totalTrades > 0 ? (winCount / Math.max(1, winCount + lossCount)) * 100 : 0;

            const stats = {
                totalChecks: await prisma.analysisLog.count({ where: { type: 'decision' } }),
                tradesExecuted: totalTrades,
                totalPnl: totalPnl,
                winRate: winRate
            };

            return res.status(200).json({
                success: true,
                data: {
                    isRunning: state.isRunning,
                    lastCheck: state.updatedAt,
                    logs,
                    stats,
                    lastDecision: latestLog?.data,
                    // Positions would ideally be calculated from DB trades or fetched live
                    positions: []
                },
            });
        } catch (error) {
            console.error('Auto-trading GET error:', {
                message: error.message,
                stack: error.stack,
                code: error.code
            });
            return res.status(500).json({
                success: false,
                error: 'Database error',
                details: error.message
            });
        }
    }

    if (method === 'POST') {
        const { action, symbol = 'BTCUSDT' } = req.body;

        try {
            if (action === 'start') {
                const state = await prisma.botState.upsert({
                    where: { id: 'global' },
                    update: { isRunning: true, symbol },
                    create: { id: 'global', isRunning: true, symbol },
                });

                await prisma.analysisLog.create({
                    data: {
                        type: 'info',
                        message: `Auto-trading started for ${symbol}`,
                    }
                });

                return res.status(200).json({
                    success: true,
                    message: 'Auto-trading started',
                    data: state
                });
            }

            if (action === 'stop') {
                const state = await prisma.botState.upsert({
                    where: { id: 'global' },
                    update: { isRunning: false },
                    create: { id: 'global', isRunning: false },
                });

                await prisma.analysisLog.create({
                    data: {
                        type: 'info',
                        message: `Auto-trading stopped by user`,
                    }
                });

                return res.status(200).json({
                    success: true,
                    message: 'Auto-trading stopped',
                    data: state
                });
            }

            if (action === 'check') {
                const state = await prisma.botState.findUnique({
                    where: { id: 'global' },
                });

                return res.status(200).json({
                    success: true,
                    data: {
                        state,
                        message: "Manual check triggered via Cron logic recommended"
                    },
                });
            }

            return res.status(400).json({
                success: false,
                error: 'Invalid action. Use: start, stop',
            });
        } catch (error) {
            console.error('Auto-trading action error:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to process auto-trading action'
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
