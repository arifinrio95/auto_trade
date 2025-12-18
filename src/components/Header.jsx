export default function Header({ symbol, currentPrice, priceChange, onSymbolChange }) {
    const symbols = [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT',
        'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT'
    ];

    const isPositive = priceChange >= 0;

    return (
        <header className="glass-header sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-black text-white rounded-lg">
                            <span className="text-lg">✦</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-semibold tracking-tight text-gray-900 leading-none">AutoTrade</h1>
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Binance Testnet</span>
                        </div>
                    </div>

                    {/* Center Info - Desktop */}
                    <div className="hidden md:flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Price</span>
                            <span className="text-sm font-medium tabular-nums text-gray-900">
                                ${currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '---'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">24h Change</span>
                            <span className={`text-sm font-medium tabular-nums flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '↑' : '↓'} {Math.abs(priceChange || 0).toFixed(2)}%
                            </span>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <select
                                value={symbol}
                                onChange={(e) => onSymbolChange(e.target.value)}
                                className="appearance-none bg-gray-100 border-none text-sm font-medium text-gray-900 py-1.5 pl-3 pr-8 rounded-md focus:ring-0 cursor-pointer hover:bg-gray-200 transition-colors"
                            >
                                {symbols.map(s => (
                                    <option key={s} value={s}>{s.replace('USDT', '')}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        <div className="h-4 w-px bg-gray-300 mx-1 hidden sm:block"></div>

                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-medium text-gray-500 hidden sm:block">Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
