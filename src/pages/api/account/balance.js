import { BinanceClient } from '../../../lib/binance';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const client = new BinanceClient(
            process.env.BINANCE_API_KEY,
            process.env.BINANCE_SECRET_KEY
        );

        const account = await client.getAccountInfo();

        // Filter to show only non-zero balances
        const balances = account.balances
            .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
            .map(b => ({
                asset: b.asset,
                free: parseFloat(b.free),
                locked: parseFloat(b.locked),
                total: parseFloat(b.free) + parseFloat(b.locked),
            }));

        res.status(200).json({
            success: true,
            data: {
                makerCommission: account.makerCommission,
                takerCommission: account.takerCommission,
                canTrade: account.canTrade,
                canWithdraw: account.canWithdraw,
                canDeposit: account.canDeposit,
                balances,
            },
        });
    } catch (error) {
        console.error('Account error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch account data',
        });
    }
}
