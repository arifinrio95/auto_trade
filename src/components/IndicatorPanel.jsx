export default function IndicatorPanel({ indicators, signals, strength }) {
    if (!indicators) {
        return (
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-2xl">📊</span> Technical Indicators
                </h3>
                <div className="flex items-center justify-center h-40 text-gray-500">
                    Loading indicators...
                </div>
            </div>
        );
    }

    const getSignalColor = (signal) => {
        switch (signal) {
            case 'BULLISH':
            case 'UPTREND':
            case 'OVERSOLD':
            case 'ABOVE_VWAP':
                return 'text-green-400';
            case 'BEARISH':
            case 'DOWNTREND':
            case 'OVERBOUGHT':
            case 'BELOW_VWAP':
                return 'text-red-400';
            default:
                return 'text-yellow-400';
        }
    };

    const getSignalBg = (signal) => {
        switch (signal) {
            case 'BULLISH':
            case 'UPTREND':
            case 'OVERSOLD':
            case 'ABOVE_VWAP':
                return 'bg-green-500/10 border-green-500/30';
            case 'BEARISH':
            case 'DOWNTREND':
            case 'OVERBOUGHT':
            case 'BELOW_VWAP':
                return 'bg-red-500/10 border-red-500/30';
            default:
                return 'bg-yellow-500/10 border-yellow-500/30';
        }
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900">Technical Analysis</h3>
            </div>

            {/* Signal Strength */}
            {strength && (
                <div className="mb-8 p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-pro-label mb-0">Aggregate Signal</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${strength.recommendation === 'BUY' ? 'bg-green-100 text-green-700 border-green-200' :
                            strength.recommendation === 'SELL' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                            {strength.recommendation}
                        </span>
                    </div>

                    {/* Visual Strength Bar */}
                    <div className="flex items-center gap-1 h-2 w-full mb-2">
                        <div className={`h-full rounded-l transition-all duration-500 ${strength.bullish > strength.bearish ? 'bg-green-500' : 'bg-gray-300'}`} style={{ flex: strength.bullish }}></div>
                        <div className="h-full bg-gray-200" style={{ flex: strength.neutral || 1 }}></div>
                        <div className={`h-full rounded-r transition-all duration-500 ${strength.bearish > strength.bullish ? 'bg-red-500' : 'bg-gray-300'}`} style={{ flex: strength.bearish }}></div>
                    </div>

                    <div className="flex justify-between text-xs font-medium text-gray-500">
                        <span>{strength.bullish} Bullish</span>
                        <span>{strength.bearish} Bearish</span>
                    </div>
                </div>
            )}

            {/* Indicators Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {/* RSI */}
                <div className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white">
                    <div className="text-pro-label">RSI (14)</div>
                    <div className={`text-2xl font-bold tracking-tight ${indicators.rsi.signal === 'OVERSOLD' ? 'text-green-600' :
                        indicators.rsi.signal === 'OVERBOUGHT' ? 'text-red-600' : 'text-gray-900'
                        }`}>
                        {indicators.rsi.value?.toFixed(1)}
                    </div>
                    <div className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">{indicators.rsi.signal}</div>
                </div>

                {/* MACD */}
                <div className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white">
                    <div className="text-pro-label">MACD</div>
                    <div className={`text-2xl font-bold tracking-tight ${indicators.macd.trend === 'BULLISH' ? 'text-green-600' :
                        indicators.macd.trend === 'BEARISH' ? 'text-red-600' : 'text-gray-900'
                        }`}>
                        {indicators.macd.value?.toFixed(2)}
                    </div>
                    <div className="text-xs font-medium text-gray-400 mt-1">Sig: {indicators.macd.signal?.toFixed(2)}</div>
                </div>

                {/* Stochastic */}
                <div className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white">
                    <div className="text-pro-label">Stochastic</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900 tracking-tight">{indicators.stochastic.k?.toFixed(1)}</span>
                        <span className="text-sm font-medium text-gray-400">K</span>
                    </div>
                    <div className="text-xs font-medium text-gray-400 mt-1">D: {indicators.stochastic.d?.toFixed(1)}</div>
                </div>

                {/* Bollinger Bands */}
                <div className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white col-span-2 sm:col-span-1">
                    <div className="text-pro-label">Bollinger</div>
                    <div className="space-y-1.5 mt-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Upper</span>
                            <span className="font-mono font-medium text-gray-900">${indicators.bollingerBands.upper?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Mid</span>
                            <span className="font-mono font-medium text-gray-900">${indicators.bollingerBands.middle?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Lower</span>
                            <span className="font-mono font-medium text-gray-900">${indicators.bollingerBands.lower?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Moving Averages */}
                <div className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white col-span-2 sm:col-span-1">
                    <div className="text-pro-label">SMA Trend</div>
                    <div className={`text-lg font-bold mb-2 ${indicators.sma.trend === 'UPTREND' ? 'text-green-600' :
                        indicators.sma.trend === 'DOWNTREND' ? 'text-red-600' : 'text-gray-900'
                        }`}>
                        {indicators.sma.trend}
                    </div>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-400">SMA 20</span>
                            <span className="font-mono font-medium text-gray-900">${indicators.sma.sma20?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">SMA 50</span>
                            <span className="font-mono font-medium text-gray-900">${indicators.sma.sma50?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* ATR */}
                <div className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white">
                    <div className="text-pro-label">Volatility (ATR)</div>
                    <div className="text-2xl font-bold text-gray-900 tracking-tight">
                        {indicators.atr?.toFixed(2)}
                    </div>
                    <div className="text-xs font-medium text-gray-400 mt-1">Range</div>
                </div>
            </div>
        </div>
    );
}
