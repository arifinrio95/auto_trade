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
                setAutoState(data.data.state);
                setLastDecision(data.data.decision);
                setCountdown(CHECK_INTERVAL / 1000); // Reset countdown
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error('Auto-trading check failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [symbol]);

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
                setCountdown(CHECK_INTERVAL / 1000);

                // Perform initial check
                await performCheck();

                // Set up interval for periodic checks
                intervalRef.current = setInterval(performCheck, CHECK_INTERVAL);

                // Set up countdown timer
                countdownRef.current = setInterval(() => {
                    setCountdown(prev => Math.max(0, prev - 1));
                }, COUNTDOWN_UPDATE);

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

                // Clear intervals
                if (intervalRef.current) clearInterval(intervalRef.current);
                if (countdownRef.current) clearInterval(countdownRef.current);
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

    // Initial fetch on mount
    useEffect(() => {
        fetchStatus();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [fetchStatus]);

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
                                <span className={`text-lg font-bold capitalize ${lastDecision.marketOutlook === 'bullish' ? 'text-green-600' :
                                    lastDecision.marketOutlook === 'bearish' ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                    {lastDecision.marketOutlook}
                                </span>
                            </div>
                            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                {(lastDecision.confidence * 100).toFixed(0)}% Conf.
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{lastDecision.overallStrategy}</p>

                        {lastDecision.newOrder?.shouldOpen && (
                            <div className={`p-2 rounded bg-gray-50 border border-gray-100 flex items-center gap-2 text-sm font-medium ${lastDecision.newOrder.side === 'BUY' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                <span>{lastDecision.newOrder.side === 'BUY' ? 'Buy Order' : 'Sell Order'}</span>
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
