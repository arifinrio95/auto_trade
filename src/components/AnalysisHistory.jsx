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
                    return (
                        <div key={log.id || i} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold capitalize ${data.action === 'BUY' ? 'text-green-600' :
                                        data.action === 'SELL' ? 'text-red-600' : 'text-blue-600'
                                        }`}>
                                        {data.action || 'HOLD'}
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-xs font-medium text-gray-500 uppercase">
                                        {data.marketOutlook}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono">
                                    {format(new Date(log.time), 'MMM dd, HH:mm')}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed italic">
                                "{data.reason || data.reasoning || log.message}"
                            </p>
                            {data.confidence && (
                                <div className="mt-2 flex justify-end">
                                    <span className="text-[10px] bg-white border border-gray-100 px-1.5 py-0.5 rounded text-gray-400 font-bold">
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
