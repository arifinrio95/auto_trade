// Technical Analysis Indicators

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data, period) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }
    return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data, period) {
    const multiplier = 2 / (period + 1);
    const result = [];

    // First EMA is SMA
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);

    for (let i = period; i < data.length; i++) {
        ema = (data[i] - ema) * multiplier + ema;
        result.push(ema);
    }

    return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(closes, period = 14) {
    const changes = [];
    for (let i = 1; i < closes.length; i++) {
        changes.push(closes[i] - closes[i - 1]);
    }

    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    const rsi = [];

    for (let i = period; i < gains.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = calculateEMA(closes, fastPeriod);
    const slowEMA = calculateEMA(closes, slowPeriod);

    // Align arrays
    const diff = fastPeriod - slowPeriod + fastEMA.length - slowEMA.length;
    const alignedFastEMA = fastEMA.slice(diff < 0 ? 0 : diff);
    const alignedSlowEMA = slowEMA.slice(diff > 0 ? 0 : -diff);

    const minLength = Math.min(alignedFastEMA.length, alignedSlowEMA.length);

    const macdLine = [];
    for (let i = 0; i < minLength; i++) {
        macdLine.push(alignedFastEMA[i] - alignedSlowEMA[i]);
    }

    const signalLine = calculateEMA(macdLine, signalPeriod);

    const histogram = [];
    const signalOffset = macdLine.length - signalLine.length;
    for (let i = 0; i < signalLine.length; i++) {
        histogram.push(macdLine[i + signalOffset] - signalLine[i]);
    }

    return {
        macd: macdLine,
        signal: signalLine,
        histogram,
        currentMACD: macdLine[macdLine.length - 1],
        currentSignal: signalLine[signalLine.length - 1],
        currentHistogram: histogram[histogram.length - 1],
    };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(closes, period = 20, multiplier = 2) {
    const sma = calculateSMA(closes, period);
    const upper = [];
    const lower = [];

    for (let i = period - 1; i < closes.length; i++) {
        const slice = closes.slice(i - period + 1, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);

        const idx = i - period + 1;
        upper.push(sma[idx] + multiplier * stdDev);
        lower.push(sma[idx] - multiplier * stdDev);
    }

    return {
        upper,
        middle: sma,
        lower,
        currentUpper: upper[upper.length - 1],
        currentMiddle: sma[sma.length - 1],
        currentLower: lower[lower.length - 1],
    };
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(highs, lows, closes, period = 14) {
    const trueRanges = [];

    for (let i = 1; i < highs.length; i++) {
        const tr = Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        );
        trueRanges.push(tr);
    }

    // First ATR is simple average
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const result = [atr];

    for (let i = period; i < trueRanges.length; i++) {
        atr = (atr * (period - 1) + trueRanges[i]) / period;
        result.push(atr);
    }

    return result;
}

/**
 * Calculate Stochastic Oscillator
 */
export function calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
    const kValues = [];

    for (let i = kPeriod - 1; i < closes.length; i++) {
        const highSlice = highs.slice(i - kPeriod + 1, i + 1);
        const lowSlice = lows.slice(i - kPeriod + 1, i + 1);

        const highestHigh = Math.max(...highSlice);
        const lowestLow = Math.min(...lowSlice);

        const k = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
        kValues.push(k);
    }

    const dValues = calculateSMA(kValues, dPeriod);

    return {
        k: kValues,
        d: dValues,
        currentK: kValues[kValues.length - 1],
        currentD: dValues[dValues.length - 1],
    };
}

/**
 * Calculate Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(highs, lows, closes, volumes) {
    const vwap = [];
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    for (let i = 0; i < closes.length; i++) {
        const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
        cumulativeTPV += typicalPrice * volumes[i];
        cumulativeVolume += volumes[i];
        vwap.push(cumulativeTPV / cumulativeVolume);
    }

    return vwap;
}

/**
 * Analyze all indicators and generate a summary
 */
export function analyzeIndicators(candles) {
    if (candles.length < 50) {
        return null;
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    const currentPrice = closes[closes.length - 1];

    // Calculate all indicators
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const bb = calculateBollingerBands(closes);
    const stoch = calculateStochastic(highs, lows, closes);
    const atr = calculateATR(highs, lows, closes);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const vwap = calculateVWAP(highs, lows, closes, volumes);

    const currentRSI = rsi[rsi.length - 1];
    const currentATR = atr[atr.length - 1];
    const currentSMA20 = sma20[sma20.length - 1];
    const currentSMA50 = sma50[sma50.length - 1];
    const currentEMA12 = ema12[ema12.length - 1];
    const currentEMA26 = ema26[ema26.length - 1];
    const currentVWAP = vwap[vwap.length - 1];

    // Generate signals
    const signals = {
        rsi: currentRSI < 30 ? 'OVERSOLD' : currentRSI > 70 ? 'OVERBOUGHT' : 'NEUTRAL',
        macd: macd.currentMACD > macd.currentSignal ? 'BULLISH' : 'BEARISH',
        bb: currentPrice < bb.currentLower ? 'OVERSOLD' : currentPrice > bb.currentUpper ? 'OVERBOUGHT' : 'NEUTRAL',
        stoch: stoch.currentK < 20 ? 'OVERSOLD' : stoch.currentK > 80 ? 'OVERBOUGHT' : 'NEUTRAL',
        trend: currentSMA20 > currentSMA50 ? 'UPTREND' : 'DOWNTREND',
        momentum: currentEMA12 > currentEMA26 ? 'BULLISH' : 'BEARISH',
        vwap: currentPrice > currentVWAP ? 'ABOVE_VWAP' : 'BELOW_VWAP',
    };

    // Calculate overall signal strength
    let bullishSignals = 0;
    let bearishSignals = 0;

    if (signals.rsi === 'OVERSOLD') bullishSignals++;
    if (signals.rsi === 'OVERBOUGHT') bearishSignals++;
    if (signals.macd === 'BULLISH') bullishSignals++;
    if (signals.macd === 'BEARISH') bearishSignals++;
    if (signals.bb === 'OVERSOLD') bullishSignals++;
    if (signals.bb === 'OVERBOUGHT') bearishSignals++;
    if (signals.stoch === 'OVERSOLD') bullishSignals++;
    if (signals.stoch === 'OVERBOUGHT') bearishSignals++;
    if (signals.trend === 'UPTREND') bullishSignals++;
    if (signals.trend === 'DOWNTREND') bearishSignals++;
    if (signals.momentum === 'BULLISH') bullishSignals++;
    if (signals.momentum === 'BEARISH') bearishSignals++;

    return {
        currentPrice,
        indicators: {
            rsi: { value: currentRSI, signal: signals.rsi },
            macd: {
                value: macd.currentMACD,
                signal: macd.currentSignal,
                histogram: macd.currentHistogram,
                trend: signals.macd,
            },
            bollingerBands: {
                upper: bb.currentUpper,
                middle: bb.currentMiddle,
                lower: bb.currentLower,
                signal: signals.bb,
            },
            stochastic: {
                k: stoch.currentK,
                d: stoch.currentD,
                signal: signals.stoch,
            },
            atr: currentATR,
            sma: { sma20: currentSMA20, sma50: currentSMA50, trend: signals.trend },
            ema: { ema12: currentEMA12, ema26: currentEMA26, momentum: signals.momentum },
            vwap: { value: currentVWAP, signal: signals.vwap },
        },
        signals,
        strength: {
            bullish: bullishSignals,
            bearish: bearishSignals,
            total: bullishSignals + bearishSignals,
            recommendation: bullishSignals > bearishSignals + 1 ? 'BUY' :
                bearishSignals > bullishSignals + 1 ? 'SELL' : 'HOLD',
        },
        rawData: {
            rsi: rsi.slice(-20),
            macdLine: macd.macd.slice(-20),
            macdSignal: macd.signal.slice(-20),
            histogram: macd.histogram.slice(-20),
        },
    };
}
