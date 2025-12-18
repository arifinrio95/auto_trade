import { BinanceClient } from '../../../lib/binance';

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

        const trades = await client.getMyTrades(symbol, parseInt(limit));

        // Format trades with P&L calculation
        const formattedTrades = trades.map((trade, idx) => ({
            id: trade.id,
            orderId: trade.orderId,
            symbol: trade.symbol,
            side: trade.isBuyer ? 'BUY' : 'SELL',
            price: parseFloat(trade.price),
            quantity: parseFloat(trade.qty),
            quoteQty: parseFloat(trade.quoteQty),
            commission: parseFloat(trade.commission),
            commissionAsset: trade.commissionAsset,
            time: new Date(trade.time).toISOString(),
            timestamp: trade.time,
            isMaker: trade.isMaker,
        }));

        res.status(200).json({
            success: true,
            data: formattedTrades,
        });
    } catch (error) {
        console.error('Trades error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch trades',
        });
    }
}
