import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import PriceChart from '@/components/PriceChart';
import ProfitChart from '@/components/ProfitChart';
import IndicatorPanel from '@/components/IndicatorPanel';
import TradeHistory from '@/components/TradeHistory';
import BalanceCard from '@/components/BalanceCard';
import StatsPanel from '@/components/StatsPanel';
import Notification from '@/components/Notification';
import AutoTradingPanel from '@/components/AutoTradingPanel';

export default function Home() {
    // State
    const [symbol, setSymbol] = useState('BTCUSDT');
    const [marketData, setMarketData] = useState(null);
    const [balances, setBalances] = useState([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [trades, setTrades] = useState([]);
    const [decision, setDecision] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [notification, setNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'auto'
    const [stats, setStats] = useState({
        totalPnL: 0,
        winRate: 0,
        totalTrades: 0,
    });

    // Show notification helper
    const showNotification = useCallback((type, title, message) => {
        setNotification({ type, title, message });
        setTimeout(() => setNotification(null), 5000);
    }, []);

    // Fetch market data
    const fetchMarketData = useCallback(async () => {
        try {
            const res = await fetch(`/api/market/data?symbol=${symbol}&interval=1h&limit=100`);
            const data = await res.json();

            if (data.success) {
                setMarketData(data.data);
            } else {
                console.error('Market data error:', data.error);
            }
        } catch (error) {
            console.error('Failed to fetch market data:', error);
        }
    }, [symbol]);

    // Fetch account balance
    const fetchBalance = useCallback(async () => {
        try {
            const res = await fetch('/api/account/balance');
            const data = await res.json();

            if (data.success) {
                setBalances(data.data.balances);
                const usdtBalance = data.data.balances.find(b => b.asset === 'USDT');
                setTotalBalance(usdtBalance?.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        }
    }, []);

    // Fetch trade history
    const fetchTrades = useCallback(async () => {
        try {
            const res = await fetch(`/api/account/trades?symbol=${symbol}&limit=20`);
            const data = await res.json();

            if (data.success) {
                setTrades(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch trades:', error);
        }
    }, [symbol]);

    // Analyze market with AI
    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/trading/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, interval: '1h' }),
            });

            const data = await res.json();

            if (data.success) {
                setDecision(data.data.decision);
                showNotification('success', 'Analysis Complete',
                    `AI recommends: ${data.data.decision.action} with ${(data.data.decision.confidence * 100).toFixed(0)}% confidence`);
            } else {
                showNotification('error', 'Analysis Failed', data.error);
            }
        } catch (error) {
            showNotification('error', 'Analysis Error', error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Execute trade
    const handleExecute = async (orderParams) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/trading/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    ...orderParams,
                }),
            });

            const data = await res.json();

            if (data.success) {
                showNotification('success', 'Order Executed',
                    `${orderParams.side} ${orderParams.quantity} ${symbol} at market price`);

                // Refresh data
                fetchBalance();
                fetchTrades();
            } else {
                showNotification('error', 'Order Failed', data.error);
            }
        } catch (error) {
            showNotification('error', 'Execution Error', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle symbol change
    const handleSymbolChange = (newSymbol) => {
        setSymbol(newSymbol);
        setDecision(null);
        setMarketData(null);
    };

    // Fetch auto-trading status & stats
    const fetchAutoState = useCallback(async () => {
        try {
            const res = await fetch('/api/trading/auto');
            const data = await res.json();
            if (data.success) {
                setStats({
                    isRunning: data.data.isRunning,
                    totalPnL: data.data.stats.totalPnl,
                    winRate: data.data.stats.winRate,
                    totalTrades: data.data.stats.tradesExecuted,
                });
                setDecision(data.data.lastDecision);
            }
        } catch (error) {
            console.error('Failed to fetch auto-trading status:', error);
        }
    }, []);

    // Initial load and polling
    useEffect(() => {
        fetchMarketData();
        fetchBalance();
        fetchTrades();
        fetchAutoState();

        // Refresh market data every 10 seconds
        const marketInterval = setInterval(fetchMarketData, 10000);

        // Refresh balance and auto stats every 30 seconds
        const balanceInterval = setInterval(() => {
            fetchBalance();
            fetchAutoState();
        }, 30000);

        return () => {
            clearInterval(marketInterval);
            clearInterval(balanceInterval);
        };
    }, [fetchMarketData, fetchBalance, fetchTrades, fetchAutoState]);

    return (
        <div className="min-h-screen">
            {/* Notification */}
            <Notification
                notification={notification}
                onClose={() => setNotification(null)}
            />

            {/* Header */}
            <Header
                symbol={symbol}
                currentPrice={marketData?.currentPrice}
                priceChange={marketData?.priceChangePercent}
                onSymbolChange={handleSymbolChange}
            />

            {/* Main Content */}
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <div className="mb-8">
                    <StatsPanel stats={stats} isRunning={stats.isRunning} />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Chart & Indicators */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Price Chart */}
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-6 text-gray-900 tracking-tight flex items-center justify-between">
                                <span>Price Action • {symbol}</span>
                            </h3>
                            <PriceChart
                                candles={marketData?.candles}
                                currentPrice={marketData?.currentPrice}
                            />
                        </div>

                        {/* Profit Chart */}
                        <ProfitChart trades={trades} />

                        {/* Indicators */}
                        <IndicatorPanel
                            indicators={marketData?.indicators}
                            signals={marketData?.signals}
                            strength={marketData?.strength}
                        />

                        {/* Trade History */}
                        <TradeHistory trades={trades} />
                    </div>

                    {/* Right Column - Trading & Balance */}
                    <div className="space-y-8">
                        {/* Balance */}
                        <BalanceCard
                            balances={balances}
                            totalBalance={totalBalance}
                        />



                        {/* Trading Panels */}
                        <div className="space-y-8">
                            {/* Auto Pilot */}
                            <AutoTradingPanel
                                symbol={symbol}
                                onRefresh={() => {
                                    fetchAutoState();
                                    fetchTrades();
                                    fetchBalance();
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-16 text-center text-gray-400 text-xs py-8 border-t border-gray-100">
                    <p className="mb-2">
                        This is a demo trading bot connected to Binance Testnet. No real money is involved.
                    </p>
                    <p>
                        Built for educational purposes. <span className="text-gray-300">|</span>
                        <a href="https://testnet.binance.vision" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 ml-1 transition-colors">
                            Binance Testnet
                        </a>
                    </p>
                </footer>
            </main>
        </div>
    );
}
