import { useState, useMemo } from 'react';

export default function PriceChart({ candles, currentPrice }) {
    const [hoveredCandle, setHoveredCandle] = useState(null);

    const chartData = useMemo(() => {
        if (!candles || candles.length === 0) return null;

        const prices = candles.map(c => c.close);
        const minPrice = Math.min(...prices) * 0.999;
        const maxPrice = Math.max(...prices) * 1.001;
        const priceRange = maxPrice - minPrice;

        return {
            candles: candles.slice(-40),
            minPrice,
            maxPrice,
            priceRange,
        };
    }, [candles]);

    if (!chartData) {
        return (
            <div className="w-full h-64 flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    const { candles: visibleCandles, minPrice, maxPrice, priceRange } = chartData;
    const chartWidth = 100;
    const chartHeight = 100;
    const candleWidth = chartWidth / visibleCandles.length;
    const candleBodyWidth = candleWidth * 0.6;

    // Generate price line
    const priceLine = visibleCandles.map((candle, i) => {
        const x = (i + 0.5) * candleWidth;
        const y = ((maxPrice - candle.close) / priceRange) * chartHeight;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full">
            {/* Price labels */}
            <div className="flex justify-between items-center text-xs text-gray-500 mb-4 font-medium">
                <span className="bg-gray-100 px-2 py-1 rounded">H: ${maxPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-2xl font-bold text-gray-900 tracking-tight">${currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '--'}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">L: ${minPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* Chart */}
            <div className="relative w-full h-80 bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-full"
                    preserveAspectRatio="none"
                >
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map(y => (
                        <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2={chartWidth}
                            y2={y}
                            stroke="rgba(0,0,0,0.05)"
                            strokeWidth="0.1"
                        />
                    ))}

                    {/* Candlesticks */}
                    {visibleCandles.map((candle, i) => {
                        const x = i * candleWidth + (candleWidth - candleBodyWidth) / 2;
                        const isGreen = candle.close >= candle.open;
                        const color = isGreen ? '#34C759' : '#FF3B30'; // Apple Green/Red

                        const bodyTop = ((maxPrice - Math.max(candle.open, candle.close)) / priceRange) * chartHeight;
                        const bodyBottom = ((maxPrice - Math.min(candle.open, candle.close)) / priceRange) * chartHeight;
                        const bodyHeight = Math.max(bodyBottom - bodyTop, 0.5);

                        const wickTop = ((maxPrice - candle.high) / priceRange) * chartHeight;
                        const wickBottom = ((maxPrice - candle.low) / priceRange) * chartHeight;
                        const wickX = x + candleBodyWidth / 2;

                        return (
                            <g
                                key={i}
                                onMouseEnter={() => setHoveredCandle(candle)}
                                onMouseLeave={() => setHoveredCandle(null)}
                                className="cursor-pointer transition-opacity hover:opacity-80"
                            >
                                {/* Wick */}
                                <line
                                    x1={wickX}
                                    y1={wickTop}
                                    x2={wickX}
                                    y2={wickBottom}
                                    stroke={color}
                                    strokeWidth="0.2"
                                />
                                {/* Body */}
                                <rect
                                    x={x}
                                    y={bodyTop}
                                    width={candleBodyWidth}
                                    height={bodyHeight}
                                    fill={color}
                                    rx="0.1"
                                />
                            </g>
                        );
                    })}

                    {/* Current price line */}
                    {currentPrice && (
                        <>
                            <line
                                x1="0"
                                y1={((maxPrice - currentPrice) / priceRange) * chartHeight}
                                x2={chartWidth}
                                y2={((maxPrice - currentPrice) / priceRange) * chartHeight}
                                stroke="#1D1D1F"
                                strokeWidth="0.15"
                                strokeDasharray="1,1"
                                opacity="0.5"
                            />
                        </>
                    )}
                </svg>

                {/* Hover tooltip - Apple Style Popover */}
                {hoveredCandle && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 p-3 text-xs z-10 pointer-events-none w-48">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                            <span className="text-gray-500 font-medium">Open</span>
                            <span className="text-gray-900 font-mono text-right">${hoveredCandle.open.toFixed(2)}</span>

                            <span className="text-gray-500 font-medium">High</span>
                            <span className="text-green-600 font-mono text-right">${hoveredCandle.high.toFixed(2)}</span>

                            <span className="text-gray-500 font-medium">Low</span>
                            <span className="text-red-600 font-mono text-right">${hoveredCandle.low.toFixed(2)}</span>

                            <span className="text-gray-500 font-medium">Close</span>
                            <span className="text-gray-900 font-mono text-right">${hoveredCandle.close.toFixed(2)}</span>

                            <span className="text-gray-500 font-medium">Vol</span>
                            <span className="text-gray-900 font-mono text-right opacity-80">{hoveredCandle.volume.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Time labels - Minimal */}
            <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wide">
                <span>{visibleCandles[0] && new Date(visibleCandles[0].openTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>{visibleCandles[visibleCandles.length - 1] && new Date(visibleCandles[visibleCandles.length - 1].closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
}
