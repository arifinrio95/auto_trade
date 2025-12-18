import { BinanceClient } from '../../../lib/binance';
import prisma from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { symbol, side, type = 'MARKET', quantity, price } = req.body;

    // Validation
    if (!symbol || !side || !quantity) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: symbol, side, quantity',
        });
    }

    if (!['BUY', 'SELL'].includes(side.toUpperCase())) {
        return res.status(400).json({
            success: false,
            error: 'Invalid side. Must be BUY or SELL',
        });
    }

    try {
        const client = new BinanceClient(
            process.env.BINANCE_API_KEY,
            process.env.BINANCE_SECRET_KEY
        );

        let order;

        if (type.toUpperCase() === 'MARKET') {
            order = await client.placeMarketOrder(
                symbol.toUpperCase(),
                side.toUpperCase(),
                quantity
            );
        } else if (type.toUpperCase() === 'LIMIT') {
            if (!price) {
                return res.status(400).json({
                    success: false,
                    error: 'Price is required for LIMIT orders',
                });
            }
            order = await client.placeLimitOrder(
                symbol.toUpperCase(),
                side.toUpperCase(),
                quantity,
                price
            );
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid order type. Must be MARKET or LIMIT',
            });
        }

        if (order.status === 'FILLED' || order.status === 'NEW') {
            await prisma.trade.create({
                data: {
                    symbol: order.symbol,
                    side: order.side,
                    price: parseFloat(order.price) || 0, // Market orders might not have price immediately, but response usually does 
                    // Note: accessing fills for accurate price would be better for market orders
                    quantity: parseFloat(order.executedQty),
                    quoteQty: parseFloat(order.cummulativeQuoteQty),
                    commission: 0, // Ideally parse fills for commission
                    commissionAsset: 'USDT', // Default
                    orderId: order.orderId.toString(),
                    status: order.status
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                orderId: order.orderId,
                symbol: order.symbol,
                side: order.side,
                type: order.type,
                status: order.status,
                price: order.price,
                origQty: order.origQty,
                executedQty: order.executedQty,
                cummulativeQuoteQty: order.cummulativeQuoteQty,
                transactTime: new Date(order.transactTime).toISOString(),
            },
        });
    } catch (error) {
        console.error('Order/Database error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to place order',
            details: 'Order execution or database persistence failed'
        });
    }
}
