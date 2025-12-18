import { BinanceClient } from '../../../lib/binance';
import prisma from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { symbol = 'BTCUSDT', limit = 50 } = req.query;

    try {
        const apiKey = process.env.BINANCE_API_KEY;
        const secretKey = process.env.BINANCE_SECRET_KEY;

        console.log('API Handler Debug:', {
            hasApiKey: !!apiKey,
            hasSecretKey: !!secretKey,
            apiKeyPrefix: apiKey ? apiKey.substring(0, 4) : 'none'
        });

        const client = new BinanceClient(apiKey, secretKey);

        // 1. Fetch from Binance
        const binanceTrades = await client.getMyTrades(symbol, parseInt(limit));

        // 2. Sync to Database (Upsert carefully)
        // We want to fetch from Binance to get "fills", but we don't want to overwrite 
        // our local data (like TP/SL) if the trade was created by our Cron.

        for (const trade of binanceTrades) {
            const orderIdStr = trade.orderId.toString();

            // Check existence first
            const existing = await prisma.trade.findUnique({
                where: { orderId: orderIdStr }
            });

            if (existing) {
                // If exists, just ensure status is FILLED (if it wasn't)
                if (existing.status !== 'FILLED') {
                    await prisma.trade.update({
                        where: { id: existing.id }, // Use internal ID for safety
                        data: { status: 'FILLED' }
                    });
                }
            } else {
                // If not exists, create it (Historical import)
                await prisma.trade.create({
                    data: {
                        orderId: orderIdStr,
                        symbol: trade.symbol,
                        side: trade.isBuyer ? 'BUY' : 'SELL',
                        price: parseFloat(trade.price),
                        quantity: parseFloat(trade.qty),
                        quoteQty: parseFloat(trade.quoteQty),
                        commission: parseFloat(trade.commission),
                        commissionAsset: trade.commissionAsset,
                        time: new Date(trade.time),
                        status: 'FILLED'
                    }
                });
            }
        }

        // 3. Fetch final history from DB (Source of Truth)
        const dbTrades = await prisma.trade.findMany({
            where: { symbol },
            orderBy: { time: 'desc' },
            take: 100
        });

        // 4. Calculate PnL and Statuses
        const { calculateRealizedPnL } = require('../../../lib/trading_utils');
        // We need them in ASC order for PnL calc
        const sortedForPnL = [...dbTrades].sort((a, b) => new Date(a.time) - new Date(b.time));
        const tradesWithPnL = calculateRealizedPnL(sortedForPnL);

        // 5. Format for UI (return latest first)
        const formattedTrades = tradesWithPnL
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .map(trade => ({
                ...trade,
                id: trade.id,
                time: trade.time instanceof Date ? trade.time.toISOString() : trade.time,
                timestamp: new Date(trade.time).getTime()
            }));

        res.status(200).json({
            success: true,
            data: formattedTrades,
        });
    } catch (error) {
        console.error('Trades sync/fetch error:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });

        // Fallback: If DB fails but Binance works, or vice-versa
        try {
            console.log('Attempting DB fallback for trades...');
            const dbTrades = await prisma.trade.findMany({
                where: { symbol },
                orderBy: { time: 'desc' },
                take: 100
            });
            return res.status(200).json({
                success: true,
                data: dbTrades.map(t => ({ ...t, time: t.time.toISOString() })),
                warning: 'Sync failed, showing cached data'
            });
        } catch (dbError) {
            console.error('Final DB fallback failed:', dbError);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to sync trades',
                details: 'Database connectivity issue detected'
            });
        }
    }
}
