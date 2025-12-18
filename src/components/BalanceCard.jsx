export default function BalanceCard({ balances, totalBalance }) {
    const mainAssets = ['USDT', 'BTC', 'ETH', 'BNB', 'BUSD'];

    // Sort balances - main assets first
    const sortedBalances = [...(balances || [])].sort((a, b) => {
        const aIndex = mainAssets.indexOf(a.asset);
        const bIndex = mainAssets.indexOf(b.asset);
        if (aIndex === -1 && bIndex === -1) return b.total - a.total;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
    });

    const getAssetIcon = (asset) => {
        const icons = {
            BTC: '₿',
            ETH: 'Ξ',
            USDT: '$',
            BNB: '◆',
            BUSD: '$',
        };
        return icons[asset] || '○';
    };

    const getAssetColor = (asset) => {
        const colors = {
            BTC: 'text-orange-400',
            ETH: 'text-blue-400',
            USDT: 'text-green-400',
            BNB: 'text-yellow-400',
            BUSD: 'text-green-400',
        };
        return colors[asset] || 'text-gray-400';
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Portfolio</h3>
                <span className="badge badge-neutral bg-gray-100 text-gray-500 border-none">Testnet</span>
            </div>

            {/* Total Balance */}
            <div className="mb-8">
                <div className="text-pro-label">Total Estimate</div>
                <div className="text-4xl font-bold text-gray-900 tracking-tight">
                    ${totalBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    <span className="text-lg text-gray-400 font-normal ml-2">USDT</span>
                </div>
            </div>

            {/* Assets List */}
            {sortedBalances.length > 0 ? (
                <div className="w-full">
                    {/* Header */}
                    <div className="grid grid-cols-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                        <div>Asset</div>
                        <div className="text-right">Balance</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {sortedBalances.slice(0, 8).map((balance) => (
                            <div
                                key={balance.asset}
                                className="grid grid-cols-2 py-3 px-2 hover:bg-gray-50 transition-colors rounded-lg -mx-2"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${balance.asset === 'USDT' ? 'bg-green-100 text-green-700' :
                                            balance.asset === 'BTC' ? 'bg-orange-100 text-orange-700' :
                                                balance.asset === 'ETH' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {balance.asset[0]}
                                    </div>
                                    <span className="font-medium text-gray-900">{balance.asset}</span>
                                </div>
                                <div className="text-right flex flex-col justify-center">
                                    <span className="text-sm font-medium text-gray-900">{parseFloat(balance.free).toFixed(4)}</span>
                                    {balance.locked > 0 && <span className="text-[10px] text-gray-400">Locked: {balance.locked}</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {sortedBalances.length > 8 && (
                        <div className="text-center text-xs text-gray-400 py-4 font-medium cursor-pointer hover:text-gray-900 transition-colors">
                            Show All Assets
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400">
                    <p>No assets found</p>
                </div>
            )}
        </div>
    );
}
