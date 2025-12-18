import { useState } from 'react';

export default function TradePanel({
    currentPrice,
    onAnalyze,
    onExecute,
    decision,
    isLoading
}) {
    const [quantity, setQuantity] = useState('0.001');
    const [orderType, setOrderType] = useState('MARKET');
    const [limitPrice, setLimitPrice] = useState('');

    const handleExecute = (side) => {
        onExecute({
            side,
            type: orderType,
            quantity: parseFloat(quantity),
            price: orderType === 'LIMIT' ? parseFloat(limitPrice) : null,
        });
    };

    return (
        <div className="card">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900 tracking-tight">
                AI Trading Command
            </h3>

            {/* Decision Display */}
            {decision && (
                <div className={`mb-6 p-4 rounded-lg border ${decision.action === 'BUY' ? 'bg-green-50 border-green-100' :
                    decision.action === 'SELL' ? 'bg-red-50 border-red-100' :
                        'bg-yellow-50 border-yellow-100'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-2xl font-bold tracking-tight ${decision.action === 'BUY' ? 'text-green-700' :
                            decision.action === 'SELL' ? 'text-red-700' :
                                'text-yellow-700'
                            }`}>
                            {decision.action === 'BUY' ? '↑' : decision.action === 'SELL' ? '↓' : '⏸'}
                            {' '}{decision.action}
                        </span>
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-white/50 px-2 py-1 rounded">
                            {(decision.confidence * 100).toFixed(0)}% Confidence
                        </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4 leading-relaxed font-medium">{decision.reasoning}</p>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        {decision.stopLoss && (
                            <div className="flex justify-between p-2 bg-white rounded border border-gray-100">
                                <span className="text-gray-500 font-medium">Stop Loss</span>
                                <span className="text-red-600 font-mono font-bold">${decision.stopLoss.toFixed(2)}</span>
                            </div>
                        )}
                        {decision.takeProfit && (
                            <div className="flex justify-between p-2 bg-white rounded border border-gray-100">
                                <span className="text-gray-500 font-medium">Take Profit</span>
                                <span className="text-green-600 font-mono font-bold">${decision.takeProfit.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {decision.keyFactors && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {decision.keyFactors.map((factor, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-600 shadow-sm">
                                    {factor}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="text-[10px] text-gray-400 mt-4 font-medium uppercase tracking-wide">
                        {new Date(decision.timestamp).toLocaleTimeString()} • {decision.source || 'AI Model'}
                    </div>
                </div>
            )}

            {/* Analysis Button */}
            <button
                onClick={onAnalyze}
                disabled={isLoading}
                className="btn btn-primary w-full mb-8 shadow-md hover:shadow-lg transform active:scale-[0.99] transition-all"
            >
                {isLoading ? (
                    <>
                        <span className="animate-spin mr-2">⟳</span> Analyzing...
                    </>
                ) : (
                    <>
                        <span>✨</span> Analyze Market
                    </>
                )}
            </button>

            {/* Order Form */}
            <div>
                <div className="text-pro-label mb-4">Manual Executive</div>

                <div className="space-y-4">
                    {/* Quantity Input */}
                    <div>
                        <label className="text-xs font-medium text-gray-700 mb-1.5 block">Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="input bg-gray-50 focus:bg-white"
                            placeholder="0.001"
                            step="0.001"
                            min="0.001"
                        />
                    </div>

                    {/* Order Type */}
                    <div>
                        <label className="text-xs font-medium text-gray-700 mb-1.5 block">Order Type</label>
                        <select
                            value={orderType}
                            onChange={(e) => setOrderType(e.target.value)}
                            className="select bg-gray-50 focus:bg-white"
                        >
                            <option value="MARKET">Market Order</option>
                            <option value="LIMIT">Limit Order</option>
                        </select>
                    </div>

                    {/* Limit Price */}
                    {orderType === 'LIMIT' && (
                        <div className="animate-fade-in">
                            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Limit Price</label>
                            <input
                                type="number"
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                                className="input bg-gray-50 focus:bg-white"
                                placeholder={currentPrice?.toFixed(2) || '0.00'}
                                step="0.01"
                            />
                        </div>
                    )}

                    {/* Trade Value */}
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Est. Value</span>
                            <span className="text-gray-900 font-mono font-bold">
                                ${((parseFloat(quantity) || 0) * (currentPrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Buy/Sell Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={() => handleExecute('BUY')}
                            disabled={isLoading}
                            className="btn bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md"
                        >
                            BUY
                        </button>
                        <button
                            onClick={() => handleExecute('SELL')}
                            disabled={isLoading}
                            className="btn bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md"
                        >
                            SELL
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
