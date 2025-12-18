import { BinanceClient } from '../../../lib/binance';
import prisma from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { symbol = 'BTCUSDT', limit = 50 } = req.query;

    try {
        const client = new BinanceClient(
            process.env.BINANCE_API_KEY,
            process.env.BINANCE_SECRET_KEY
        );

        // 1. Fetch from Binance
        const binanceTrades = await client.getMyTrades(symbol, parseInt(limit));

        // 2. Sync to Database (Upsert)
        await Promise.all(binanceTrades.map(trade =>
            prisma.trade.upsert({
                where: { orderId: trade.orderId.toString() },
                update: {
                    status: 'FILLED', // Historical trades are always filled
                },
                create: {
                    orderId: trade.orderId.toString(),
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
            })
        ));

        // 3. Fetch final history from DB (Source of Truth)
        const dbTrades = await prisma.trade.findMany({
            where: { symbol },
            orderBy: { time: 'desc' },
            take: 100
        });

        // 4. Format for UI
        const formattedTrades = dbTrades.map(trade => ({
            ...trade,
            id: trade.id,
            time: trade.time.toISOString(),
            timestamp: trade.time.getTime()
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
