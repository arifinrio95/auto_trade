import { BinanceClient } from '../../../lib/binance';
import prisma from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const client = new BinanceClient(
            process.env.BINANCE_API_KEY,
            process.env.BINANCE_SECRET_KEY
        );

        // 1. Get current balances
        const accountInfo = await client.getAccountInfo();
        const btcBalance = accountInfo.balances.find(b => b.asset === 'BTC');
        const btcAmount = btcBalance ? parseFloat(btcBalance.free) : 0;

        if (btcAmount < 0.0001) {
            return res.status(200).json({
                success: true,
                message: 'No significant BTC balance to reset. Account is already clean.'
            });
        }

        // 2. Sell all BTC for USDT
        console.log(`Resetting balance: Selling ${btcAmount} BTC...`);
        const order = await client.placeMarketOrder('BTCUSDT', 'SELL', btcAmount);

        // 3. Log the reset trade
        const avgPrice = parseFloat(order.executedQty) > 0
            ? parseFloat(order.cummulativeQuoteQty) / parseFloat(order.executedQty)
            : parseFloat(order.price);

        await prisma.trade.create({
            data: {
                orderId: order.orderId.toString(),
                symbol: 'BTCUSDT',
                side: 'SELL',
                price: avgPrice,
                quantity: parseFloat(order.executedQty),
                quoteQty: parseFloat(order.cummulativeQuoteQty),
                status: 'FILLED',
                commission: 0,
                commissionAsset: 'USDT'
            }
        });

        res.status(200).json({
            success: true,
            message: `Balance reset successful. Sold ${btcAmount} BTC.`,
            data: order
        });
    } catch (error) {
        console.error('Reset error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to reset balance'
        });
    }
}
