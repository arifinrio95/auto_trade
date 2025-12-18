import { format } from 'date-fns';

export default function TradeHistory({ trades }) {
    if (!trades || trades.length === 0) {
        return (
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 tracking-tight text-gray-900">
                    Trade History
                </h3>
                <div className="text-center py-12">
                    <p className="text-gray-400 text-sm">No trades executed yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900">Trade History</h3>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {trades.length} trades
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <tr>
                            <th className="pb-3 pl-2 font-medium">Time</th>
                            <th className="pb-3 font-medium">Side</th>
                            <th className="pb-3 font-medium text-right">Price</th>
                            <th className="pb-3 font-medium text-right">Qty</th>
                            <th className="pb-3 font-medium text-right">Total</th>
                            <th className="pb-3 font-medium text-right pr-2">Fee</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {trades.map((trade, i) => (
                            <tr key={trade.id || i} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 pl-2 text-gray-500 font-mono text-xs">
                                    {format(new Date(trade.time || trade.timestamp), 'HH:mm:ss')}
                                </td>
                                <td className="py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${trade.side === 'BUY' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                        {trade.side}
                                    </span>
                                </td>
                                <td className="py-3 text-right font-medium text-gray-900 font-mono">
                                    ${parseFloat(trade.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 text-right text-gray-600 font-mono">
                                    {parseFloat(trade.quantity).toFixed(4)}
                                </td>
                                <td className="py-3 text-right font-medium text-gray-900 font-mono">
                                    ${parseFloat(trade.quoteQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 pr-2 text-right text-xs text-gray-400 font-mono">
                                    {parseFloat(trade.commission).toFixed(6)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
