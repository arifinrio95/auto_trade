import { BinanceClient } from '../../../lib/binance';
import { analyzeIndicators } from '../../../lib/indicators';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { symbol = 'BTCUSDT', interval = '1h', limit = 100 } = req.query;

    try {
        const client = new BinanceClient(
            process.env.BINANCE_API_KEY,
            process.env.BINANCE_SECRET_KEY
        );

        // Fetch candles data
        const candles = await client.getKlines(symbol, interval, parseInt(limit));

        // Get 24h ticker
        const ticker = await client.get24hTicker(symbol);

        // Calculate indicators
        const analysis = analyzeIndicators(candles);

        res.status(200).json({
            success: true,
            data: {
                symbol,
                interval,
                currentPrice: parseFloat(ticker.lastPrice),
                priceChange: parseFloat(ticker.priceChange),
                priceChangePercent: parseFloat(ticker.priceChangePercent),
                highPrice: parseFloat(ticker.highPrice),
                lowPrice: parseFloat(ticker.lowPrice),
                volume: parseFloat(ticker.volume),
                quoteVolume: parseFloat(ticker.quoteVolume),
                candles: candles.slice(-50), // Last 50 candles for chart
                indicators: analysis?.indicators || null,
                signals: analysis?.signals || null,
                strength: analysis?.strength || null,
            },
        });
    } catch (error) {
        console.error('Market data error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch market data',
        });
    }
}
