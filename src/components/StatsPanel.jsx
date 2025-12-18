export default function StatsPanel({ stats }) {
    const { totalPnL = 0, winRate = 0, totalTrades = 0 } = stats || {};
    const pnlColor = totalPnL >= 0 ? 'text-green-600' : 'text-red-600';

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in">
            <div className="flex gap-8 group">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Net P&L</span>
                    <span className={`text-xl font-bold tracking-tight ${pnlColor}`}>
                        {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                    </span>
                </div>

                <div className="w-px bg-gray-100 h-auto self-stretch"></div>

                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Win Rate</span>
                    <span className="text-xl font-bold tracking-tight text-gray-900">
                        {winRate.toFixed(1)}<span className="text-sm font-normal text-gray-400">%</span>
                    </span>
                </div>

                <div className="w-px bg-gray-100 h-auto self-stretch"></div>

                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Total Trades</span>
                    <span className="text-xl font-bold tracking-tight text-gray-900">
                        {totalTrades}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Status</span>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-semibold text-green-700">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
