import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

export function initializeGemini(apiKey) {
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.warn('Gemini API key not configured');
        return false;
    }

    genAI = new GoogleGenerativeAI(apiKey);
    // Using the new gemini-2.0-flash model
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    return true;
}

/**
 * Generate trading decision using Gemini AI
 */
export async function generateTradingDecision(marketData, indicators, recentCandles) {
    if (!model) {
        // Return mock decision if Gemini not configured
        return generateMockDecision(indicators);
    }

    const prompt = `You are an expert cryptocurrency trading analyst. Analyze the following market data and technical indicators to make a trading decision.

## Market Data
- **Symbol**: ${marketData.symbol}
- **Current Price**: $${marketData.currentPrice.toFixed(2)}
- **24h Change**: ${marketData.priceChangePercent}%
- **24h High**: $${marketData.highPrice}
- **24h Low**: $${marketData.lowPrice}
- **24h Volume**: ${marketData.volume}

## Technical Indicators
- **RSI (14)**: ${indicators.rsi.value?.toFixed(2)} (${indicators.rsi.signal})
- **MACD**: ${indicators.macd.value?.toFixed(4)} | Signal: ${indicators.macd.signal?.toFixed(4)} | Histogram: ${indicators.macd.histogram?.toFixed(4)} (${indicators.macd.trend})
- **Bollinger Bands**: Upper: $${indicators.bollingerBands.upper?.toFixed(2)} | Middle: $${indicators.bollingerBands.middle?.toFixed(2)} | Lower: $${indicators.bollingerBands.lower?.toFixed(2)} (${indicators.bollingerBands.signal})
- **Stochastic**: K: ${indicators.stochastic.k?.toFixed(2)} | D: ${indicators.stochastic.d?.toFixed(2)} (${indicators.stochastic.signal})
- **ATR**: ${indicators.atr?.toFixed(4)}
- **SMA**: SMA20: $${indicators.sma.sma20?.toFixed(2)} | SMA50: $${indicators.sma.sma50?.toFixed(2)} (${indicators.sma.trend})
- **EMA**: EMA12: $${indicators.ema.ema12?.toFixed(2)} | EMA26: $${indicators.ema.ema26?.toFixed(2)} (${indicators.ema.momentum})
- **VWAP**: $${indicators.vwap.value?.toFixed(2)} (${indicators.vwap.signal})

## Recent Price Action (Last 5 Candles)
${recentCandles.slice(-5).map((c, i) => `- Candle ${i + 1}: O: $${c.open.toFixed(2)} H: $${c.high.toFixed(2)} L: $${c.low.toFixed(2)} C: $${c.close.toFixed(2)} V: ${c.volume.toFixed(2)}`).join('\n')}

## Analysis Request
Based on the above data, provide a trading decision. Consider:
1. Overall trend direction
2. Momentum indicators
3. Overbought/oversold conditions
4. Support and resistance levels
5. Risk management

**IMPORTANT**: Respond ONLY with a valid JSON object in this exact format, no markdown, no explanation outside JSON:
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation of your decision",
  "entryPrice": <suggested entry price or null>,
  "stopLoss": <suggested stop loss price>,
  "takeProfit": <suggested take profit price>,
  "riskRewardRatio": <calculated risk/reward ratio>,
  "timeframe": "short" | "medium" | "long",
  "keyFactors": ["factor1", "factor2", "factor3"]
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up the response - remove markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const decision = JSON.parse(text);
        return {
            ...decision,
            timestamp: new Date().toISOString(),
            source: 'gemini-ai',
        };
    } catch (error) {
        console.error('Gemini API error:', error);
        // Fallback to mock decision
        return generateMockDecision(indicators);
    }
}

/**
 * Generate auto-trading decision with position management
 * This is used for the automated trading loop
 */
export async function generateAutoTradingDecision(marketData, indicators, recentCandles, openPositions, tradeHistory) {
    if (!model) {
        return generateMockAutoDecision(indicators, openPositions);
    }

    const positionsInfo = openPositions.length > 0
        ? openPositions.map((p, i) => `
  Position ${i + 1}:
    - Entry Price: $${p.entryPrice?.toFixed(2) || 'N/A'}
    - Quantity: ${p.quantity}
    - Side: ${p.side}
    - P&L: ${p.pnl ? (p.pnl >= 0 ? '+' : '') + p.pnl.toFixed(2) + '%' : 'N/A'}
    - Time Open: ${p.timeOpen || 'Unknown'}
`).join('')
        : 'No open positions';

    const recentTradesInfo = tradeHistory.slice(0, 5).map((t, i) =>
        `Trade ${i + 1}: ${t.side} at $${parseFloat(t.price).toFixed(2)} (${t.quantity} units)`
    ).join('\n  ');

    const prompt = `You are an expert cryptocurrency trading bot manager. You are managing an automated trading system that runs every 1 hour.
    
## Current Market Data
- **Symbol**: ${marketData.symbol}
- **Current Price**: $${marketData.currentPrice.toFixed(2)}
- **24h Change**: ${marketData.priceChangePercent}%
- **24h High**: $${marketData.highPrice}
- **24h Low**: $${marketData.lowPrice}

## Technical Indicators
- **RSI (14)**: ${indicators.rsi.value?.toFixed(2)} (${indicators.rsi.signal})
- **MACD**: ${indicators.macd.value?.toFixed(4)} (${indicators.macd.trend})
- **Bollinger Bands**: ${indicators.bollingerBands.signal}
- **Stochastic**: K: ${indicators.stochastic.k?.toFixed(2)} (${indicators.stochastic.signal})
- **Trend**: ${indicators.sma.trend}
- **Momentum**: ${indicators.ema.momentum}

## Recent Price Action (Last 20 Candles)
${recentCandles.slice(-20).map((c, i) => `- C${i + 1}: O: $${c.open.toFixed(2)} H: $${c.high.toFixed(2)} L: $${c.low.toFixed(2)} C: $${c.close.toFixed(2)} V: ${c.volume.toFixed(2)}`).join('\n')}

## Current Portfolio Status
${positionsInfo}

## Recent Trade History (Context)
${recentTradesInfo || 'No recent trades recorded in local DB'}

## Your Task
Analyze the market and your current exposure. Decide what actions to take:

1. **For EACH existing position**: Decide if we should CLOSE (take profit or stop loss) or HOLD.
2. **For new trades**: If exposure is low, should we OPEN a new BUY or SELL position?

Rules:
- Don't overtrade. Only entry if confidence > 0.75.
- If market is uncertain, HOLD is the best choice.
- Always provide a clear, logical reason for your decision.

**IMPORTANT**: Respond ONLY with a valid JSON object in this format:
{
  "positionActions": [
    {
      "asset": "BTC",
      "action": "CLOSE" | "HOLD",
      "reason": "specific reason for this asset"
    }
  ],
  "newOrder": {
    "shouldOpen": true | false,
    "side": "BUY" | "SELL" | null,
    "quantity": 0.001,
    "reason": "explanation for new trade",
    "stopLoss": <price>,
    "takeProfit": <price>
  },
  "overallStrategy": "Brief summary",
  "marketOutlook": "bullish" | "bearish" | "neutral",
  "confidence": 0.0-1.0,
  "nextCheckRecommendation": "What to watch"
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const decision = JSON.parse(text);
        return {
            ...decision,
            timestamp: new Date().toISOString(),
            source: 'gemini-ai-auto',
        };
    } catch (error) {
        console.error('Gemini Auto-Trading API error:', error);
        return generateMockAutoDecision(indicators, openPositions);
    }
}

/**
 * Generate mock decision based on indicators when API not available
 */
function generateMockDecision(indicators) {
    const { rsi, macd, stochastic, sma } = indicators;

    let bullishScore = 0;
    let bearishScore = 0;

    // RSI analysis
    if (rsi.signal === 'OVERSOLD') bullishScore += 2;
    else if (rsi.signal === 'OVERBOUGHT') bearishScore += 2;

    // MACD analysis
    if (macd.trend === 'BULLISH') bullishScore += 2;
    else bearishScore += 2;

    // Trend analysis
    if (sma.trend === 'UPTREND') bullishScore += 1;
    else bearishScore += 1;

    // Stochastic
    if (stochastic.signal === 'OVERSOLD') bullishScore += 1;
    else if (stochastic.signal === 'OVERBOUGHT') bearishScore += 1;

    let action = 'HOLD';
    let confidence = 0.5;

    if (bullishScore >= bearishScore + 2) {
        action = 'BUY';
        confidence = Math.min(0.9, 0.5 + (bullishScore - bearishScore) * 0.1);
    } else if (bearishScore >= bullishScore + 2) {
        action = 'SELL';
        confidence = Math.min(0.9, 0.5 + (bearishScore - bullishScore) * 0.1);
    }

    return {
        action,
        confidence,
        reason: `Based on technical analysis: RSI ${rsi.signal}, MACD ${macd.trend}, Trend ${sma.trend}. Bullish signals: ${bullishScore}, Bearish signals: ${bearishScore}.`,
        entryPrice: null,
        stopLoss: null,
        takeProfit: null,
        riskRewardRatio: 2.0,
        timeframe: 'short',
        keyFactors: [
            `RSI: ${rsi.signal}`,
            `MACD: ${macd.trend}`,
            `Trend: ${sma.trend}`,
        ],
        timestamp: new Date().toISOString(),
        source: 'indicator-based',
    };
}

/**
 * Generate mock auto-trading decision
 */
function generateMockAutoDecision(indicators, openPositions) {
    const { rsi, macd, sma } = indicators;

    const positionActions = openPositions.map((p, i) => ({
        positionId: i + 1,
        action: 'HOLD',
        reason: 'Maintaining position based on current market conditions',
    }));

    let shouldOpen = false;
    let side = null;

    if (openPositions.length < 3) {
        if (rsi.signal === 'OVERSOLD' && macd.trend === 'BULLISH') {
            shouldOpen = true;
            side = 'BUY';
        } else if (rsi.signal === 'OVERBOUGHT' && macd.trend === 'BEARISH') {
            shouldOpen = true;
            side = 'SELL';
        }
    }

    return {
        positionActions,
        newOrder: {
            shouldOpen,
            side,
            quantity: 0.001,
            reason: shouldOpen
                ? `Strong ${side} signal detected based on indicators`
                : 'No clear trading opportunity at this time',
            stopLoss: null,
            takeProfit: null,
        },
        overallStrategy: 'Conservative approach - waiting for clear signals',
        marketOutlook: sma.trend === 'UPTREND' ? 'bullish' : sma.trend === 'DOWNTREND' ? 'bearish' : 'neutral',
        confidence: 0.6,
        nextCheckRecommendation: 'Monitor RSI and MACD for convergence signals',
        timestamp: new Date().toISOString(),
        source: 'indicator-based-auto',
    };
}

/**
 * Get market sentiment analysis
 */
export async function analyzeMarketSentiment(symbol, recentNews = []) {
    if (!model) {
        return {
            sentiment: 'neutral',
            score: 0.5,
            factors: ['AI analysis not available - using neutral sentiment'],
        };
    }

    const prompt = `Analyze the current market sentiment for ${symbol} cryptocurrency.
Consider general crypto market conditions and provide a sentiment analysis.

Respond ONLY with valid JSON:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "score": 0.0-1.0,
  "factors": ["factor1", "factor2"]
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return {
            sentiment: 'neutral',
            score: 0.5,
            factors: ['Analysis failed - defaulting to neutral'],
        };
    }
}
