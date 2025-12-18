import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';

export default function AutoTradingPanel({ symbol, onRefresh }) {
    const [isRunning, setIsRunning] = useState(false);
    const [autoState, setAutoState] = useState(null);
    const [lastDecision, setLastDecision] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const intervalRef = useRef(null);
    const countdownRef = useRef(null);

    const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
    const COUNTDOWN_UPDATE = 1000; // 1 second

    // Fetch current auto-trading status
    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/trading/auto');
            const data = await res.json();
            if (data.success) {
                setAutoState(data.data);
                setIsRunning(data.data.isRunning);

                // Calculate remaining time until the next FIXED hourly cron (0 * * * *)
                if (data.data.isRunning) {
                    const now = new Date();
                    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
                    const remaining = Math.max(0, Math.floor((nextHour.getTime() - now.getTime()) / 1000));
                    setCountdown(remaining);
                }
            }
        } catch (error) {
            console.error('Failed to fetch auto-trading status:', error);
        }
    }, []);

    // Perform a check
    const performCheck = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/trading/auto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check', symbol }),
            });

            const data = await res.json();

            if (data.success) {
                setAutoState(data.data);
                setLastDecision(data.data.lastDecision);
                // We DO NOT reset the countdown here because manual checks 
                // don't change the fixed GitHub Actions cron schedule.
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error('Auto-trading check failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [symbol, onRefresh]);

    // Start auto-trading
    const handleStart = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/trading/auto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', symbol }),
            });

            const data = await res.json();

            if (data.success) {
                setIsRunning(true);
                if (data.data) setAutoState(data.data);

                // Calculate initial countdown until next hour
                const now = new Date();
                const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
                setCountdown(Math.floor((nextHour.getTime() - now.getTime()) / 1000));

                // Perform initial check
                await performCheck();
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error('Failed to start auto-trading:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Stop auto-trading
    const handleStop = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/trading/auto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' }),
            });

            const data = await res.json();

            if (data.success) {
                setIsRunning(false);
                if (data.data) setAutoState(data.data);
                setCountdown(0);
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error('Failed to stop auto-trading:', error);
        } finally {
            setIsLoading(false);
        }
    };
    // Manual check trigger
    const handleManualCheck = async () => {
        if (!isRunning) return;
        await performCheck();
    };

    // Timer Management Effect
    useEffect(() => {
        fetchStatus();

        let timer = null;
        if (isRunning) {
            // Set up interval for countdown updates (1s)
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        // When countdown hits 0, it means the cron just ran.
                        // We recalculate the target to the NEXT hour to keep it accurate.
                        const now = new Date();
                        const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
                        return Math.floor((nextHour.getTime() - now.getTime()) / 1000);
                    }
                    return prev - 1;
                });
            }, COUNTDOWN_UPDATE);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isRunning, fetchStatus]);

    // Format countdown time
    const formatCountdown = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getLogTypeColor = (type) => {
        switch (type) {
            case 'trade': return 'text-green-400';
            case 'error': return 'text-red-400';
            case 'decision': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    const getLogTypeIcon = (type) => {
        switch (type) {
            case 'trade': return '💹';
            case 'error': return '❌';
            case 'decision': return '🤖';
            default: return 'ℹ️';
        }
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900">Auto Trading</h3>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${isRunning
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                    {isRunning ? 'Running' : 'Stopped'}
                </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3 mb-8">
                {!isRunning ? (
                    <button
                        onClick={handleStart}
                        disabled={isLoading}
                        className="btn bg-black hover:bg-gray-900 text-white flex-1 shadow-md hover:shadow-lg transition-all"
                    >
                        {isLoading ? (
                            <div className="spinner w-4 h-4 border-2 border-white/30 border-t-white mr-2"></div>
                        ) : (
                            <span className="mr-2">▶</span>
                        )}
                        Start Automation
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleStop}
                            disabled={isLoading}
                            className="btn bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 flex-1"
                        >
                            <span>⏹</span> Stop
                        </button>
                        <button
                            onClick={handleManualCheck}
                            disabled={isLoading}
                            className="btn bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 flex-1"
                        >
                            {isLoading ? (
                                <div className="spinner w-4 h-4 border-2 border-gray-400 border-t-gray-900"></div>
                            ) : (
                                <>
                                    <span className="mr-2">↻</span> Check Now
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>

            {/* Countdown Timer */}
            {isRunning && (
                <div className="mb-8 p-6 rounded-lg bg-gray-50 border border-gray-100 text-center">
                    <div className="text-pro-label mb-1">Next Cycle</div>
                    <div className="text-4xl font-mono font-bold text-gray-900 tracking-tighter">
                        {formatCountdown(countdown)}
                    </div>
                </div>
            )}

            {/* Stats */}
            {autoState?.stats && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{autoState.stats.totalChecks}</div>
                        <div className="text-xs text-gray-500 font-medium uppercase mt-1">Checks</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{autoState.stats.tradesExecuted}</div>
                        <div className="text-xs text-gray-500 font-medium uppercase mt-1">Trades</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{autoState.positions?.length || 0}</div>
                        <div className="text-xs text-gray-500 font-medium uppercase mt-1">Positions</div>
                    </div>
                </div>
            )}

            {/* Last Decision */}
            {lastDecision && (
                <div className="mb-8">
                    <div className="text-pro-label mb-3">Latest Analysis</div>
                    <div className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold capitalize ${(lastDecision.action === 'BUY' || lastDecision.newOrder?.side === 'BUY') ? 'text-green-600' :
                                    (lastDecision.action === 'SELL' || lastDecision.newOrder?.side === 'SELL') ? 'text-red-600' :
                                        (lastDecision.positionActions?.some(a => a.action === 'CLOSE') ? 'text-orange-600' : 'text-blue-600')
                                    }`}>
                                    {lastDecision.action || (lastDecision.newOrder?.shouldOpen ? lastDecision.newOrder.side : 'PORTFOLIO')}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="text-sm font-medium text-gray-500 uppercase tracking-tight">
                                    {lastDecision.marketOutlook}
                                </span>
                            </div>
                            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                {(lastDecision.confidence * 100).toFixed(0)}% Conf.
                            </span>
                        </div>

                        <div className="mb-3">
                            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">AI Strategy & Reasoning</div>
                            <p className="text-sm text-gray-700 leading-relaxed italic">
                                "{lastDecision.overallStrategy || lastDecision.reason || lastDecision.reasoning}"
                            </p>
                        </div>

                        {/* Portfolio Actions Detail */}
                        {lastDecision.positionActions?.length > 0 && (
                            <div className="space-y-1.5 mb-3 border-t border-gray-50 pt-3">
                                {lastDecision.positionActions.map((pa, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs">
                                        <span className={`font-bold uppercase px-1.5 py-0.5 rounded text-[9px] ${pa.action === 'CLOSE' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {pa.action} {pa.asset}
                                        </span>
                                        <span className="text-gray-500 italic">{pa.reason}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {lastDecision.newOrder?.shouldOpen && (
                            <div className={`p-2 rounded bg-gray-50 border border-gray-100 flex items-center gap-2 text-sm font-medium ${lastDecision.newOrder.side === 'BUY' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                <span className="text-[10px] bg-white px-1 rounded border border-gray-100 uppercase">New Order</span>
                                <span>{lastDecision.newOrder.side === 'BUY' ? 'Buy' : 'Sell'}</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-900">{lastDecision.newOrder.quantity} units</span>
                            </div>
                        )}

                        <div className="text-[10px] text-gray-400 mt-3 font-medium uppercase text-right">
                            Next: {lastDecision.nextCheckRecommendation}
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Log */}
            <div>
                <div className="text-pro-label mb-3">Activity Log</div>
                <div className="max-h-60 overflow-y-auto pr-2 space-y-0">
                    {autoState?.logs?.length > 0 ? (
                        <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
                            {autoState.logs.slice(0, 10).map((log, i) => (
                                <div key={i} className="py-2.5 flex gap-3 text-xs">
                                    <span className="text-gray-400 font-mono whitespace-nowrap">{format(new Date(log.time), 'HH:mm:ss')}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${log.type === 'trade' ? 'bg-green-500' :
                                        log.type === 'error' ? 'bg-red-500' :
                                            log.type === 'decision' ? 'bg-blue-500' : 'bg-gray-300'
                                        }`}></div>
                                    <span className="text-gray-700 leading-snug">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            No activity recorded yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
