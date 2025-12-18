import { BinanceClient } from '../../../lib/binance';
import { analyzeIndicators } from '../../../lib/indicators';
import { initializeGemini, generateTradingDecision } from '../../../lib/gemini';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { symbol = 'BTCUSDT', interval = '1h' } = req.body;

    try {
        const client = new BinanceClient(
            process.env.BINANCE_API_KEY,
            process.env.BINANCE_SECRET_KEY
        );

        // Initialize Gemini
        initializeGemini(process.env.GEMINI_API_KEY);

        // Fetch market data
        const candles = await client.getKlines(symbol, interval, 100);
        const ticker = await client.get24hTicker(symbol);

        // Calculate indicators
        const analysis = analyzeIndicators(candles);

        if (!analysis) {
            return res.status(400).json({
                success: false,
                error: 'Not enough data for analysis',
            });
        }

        // Market data for AI
        const marketData = {
            symbol,
            currentPrice: parseFloat(ticker.lastPrice),
            priceChangePercent: parseFloat(ticker.priceChangePercent),
            highPrice: parseFloat(ticker.highPrice),
            lowPrice: parseFloat(ticker.lowPrice),
            volume: parseFloat(ticker.volume),
        };

        // Generate AI decision
        const decision = await generateTradingDecision(
            marketData,
            analysis.indicators,
            candles
        );

        res.status(200).json({
            success: true,
            data: {
                decision,
                marketData,
                indicators: analysis.indicators,
                signals: analysis.signals,
                strength: analysis.strength,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Market analysis error:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to analyze market',
            details: 'Check Binance connectivity or AI configuration'
        });
    }
}
