import { format } from 'date-fns';

export default function AnalysisHistory({ logs }) {
    if (!logs || logs.length === 0) return null;

    const decisionLogs = logs.filter(log => log.type === 'decision');

    if (decisionLogs.length === 0) return null;

    return (
        <div className="card">
            <h3 className="text-lg font-semibold mb-6 tracking-tight text-gray-900">AI Analysis History</h3>
            <div className="space-y-4">
                {decisionLogs.slice(0, 5).map((log, i) => {
                    const data = log.data || {};
                    const isPortfolio = !!data.positionActions || !!data.newOrder;

                    let mainAction = data.action || 'HOLD';
                    let actionColor = mainAction === 'BUY' ? 'text-green-600' : mainAction === 'SELL' ? 'text-red-600' : 'text-blue-600';

                    if (isPortfolio) {
                        mainAction = data.newOrder?.shouldOpen ? `NEW ${data.newOrder.side}` : 'PORTFOLIO';
                        actionColor = data.newOrder?.shouldOpen ? (data.newOrder.side === 'BUY' ? 'text-green-600' : 'text-red-600') : 'text-purple-600';
                    }

                    return (
                        <div key={log.id || i} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${actionColor}`}>
                                        {mainAction}
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-[10px] font-medium text-gray-400 uppercase">
                                        {data.marketOutlook || 'NEUTRAL'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono">
                                    {format(new Date(log.time), 'MMM dd, HH:mm')}
                                </span>
                            </div>

                            <p className="text-xs text-gray-700 leading-relaxed font-medium mb-2">
                                {data.overallStrategy || data.reason || data.reasoning || log.message}
                            </p>

                            {isPortfolio && data.positionActions?.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {data.positionActions.map((pa, idx) => (
                                        <div key={idx} className="text-[10px] flex items-center gap-2 text-gray-500">
                                            <span className={`font-bold ${pa.action === 'CLOSE' ? 'text-red-500' : 'text-blue-500'}`}>
                                                {pa.action} {pa.asset}
                                            </span>
                                            <span className="truncate opacity-70">- {pa.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {data.confidence && (
                                <div className="mt-2 flex justify-end">
                                    <span className="text-[9px] bg-white border border-gray-100 px-1.5 py-0.5 rounded text-gray-400 font-bold uppercase tracking-tighter">
                                        {(data.confidence * 100).toFixed(0)}% Confidence
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
