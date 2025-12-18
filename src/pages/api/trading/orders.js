import { BinanceClient } from '../../../lib/binance';

export default async function handler(req, res) {
    const { method } = req;

    const client = new BinanceClient(
        process.env.BINANCE_API_KEY,
        process.env.BINANCE_SECRET_KEY
    );

    try {
        if (method === 'GET') {
            // Get open orders
            const { symbol } = req.query;
            const orders = await client.getOpenOrders(symbol || null);

            return res.status(200).json({
                success: true,
                data: orders.map(order => ({
                    orderId: order.orderId,
                    symbol: order.symbol,
                    side: order.side,
                    type: order.type,
                    status: order.status,
                    price: parseFloat(order.price),
                    origQty: parseFloat(order.origQty),
                    executedQty: parseFloat(order.executedQty),
                    time: new Date(order.time).toISOString(),
                })),
            });
        }

        if (method === 'DELETE') {
            // Cancel order
            const { symbol, orderId } = req.body;

            if (!symbol || !orderId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: symbol, orderId',
                });
            }

            const result = await client.cancelOrder(symbol, orderId);

            return res.status(200).json({
                success: true,
                data: {
                    orderId: result.orderId,
                    symbol: result.symbol,
                    status: result.status,
                    message: 'Order cancelled successfully',
                },
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Orders error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process orders request',
        });
    }
}
