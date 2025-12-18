import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Main trading store
export const useTradingStore = create(
    persist(
        (set, get) => ({
            // Settings
            symbol: 'BTCUSDT',
            interval: '1h',
            autoTrade: false,
            riskPerTrade: 1, // percentage of portfolio
            maxPositionSize: 10, // percentage of portfolio

            // Market data
            currentPrice: 0,
            priceChange24h: 0,
            indicators: null,
            candles: [],

            // Account
            balances: [],
            totalBalance: 0,

            // Trading
            openPositions: [],
            pendingOrders: [],

            // History
            tradeHistory: [],
            decisionHistory: [],

            // Stats
            totalPnL: 0,
            winRate: 0,
            totalTrades: 0,

            // Actions
            setSymbol: (symbol) => set({ symbol }),
            setInterval: (interval) => set({ interval }),
            setAutoTrade: (autoTrade) => set({ autoTrade }),
            setRiskPerTrade: (risk) => set({ riskPerTrade: risk }),

            updatePrice: (price, change) => set({
                currentPrice: price,
                priceChange24h: change
            }),

            updateIndicators: (indicators) => set({ indicators }),
            updateCandles: (candles) => set({ candles }),

            updateBalances: (balances) => {
                const total = balances.reduce((sum, b) => {
                    if (b.asset === 'USDT') return sum + parseFloat(b.free) + parseFloat(b.locked);
                    return sum;
                }, 0);
                set({ balances, totalBalance: total });
            },

            addTrade: (trade) => set((state) => {
                const newHistory = [trade, ...state.tradeHistory].slice(0, 100);
                const trades = newHistory.filter(t => t.pnl !== undefined);
                const wins = trades.filter(t => t.pnl > 0).length;
                const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

                return {
                    tradeHistory: newHistory,
                    totalTrades: trades.length,
                    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
                    totalPnL,
                };
            }),

            addDecision: (decision) => set((state) => ({
                decisionHistory: [decision, ...state.decisionHistory].slice(0, 50),
            })),

            updateOpenPositions: (positions) => set({ openPositions: positions }),
            updatePendingOrders: (orders) => set({ pendingOrders: orders }),

            clearHistory: () => set({
                tradeHistory: [],
                decisionHistory: [],
                totalPnL: 0,
                winRate: 0,
                totalTrades: 0,
            }),
        }),
        {
            name: 'trading-store',
            partialize: (state) => ({
                symbol: state.symbol,
                interval: state.interval,
                riskPerTrade: state.riskPerTrade,
                maxPositionSize: state.maxPositionSize,
                tradeHistory: state.tradeHistory,
                decisionHistory: state.decisionHistory,
                totalPnL: state.totalPnL,
                winRate: state.winRate,
                totalTrades: state.totalTrades,
            }),
        }
    )
);

// UI store for non-persistent state
export const useUIStore = create((set) => ({
    isLoading: false,
    error: null,
    notification: null,
    activeTab: 'dashboard',
    showSettings: false,

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    showNotification: (notification) => {
        set({ notification });
        setTimeout(() => set({ notification: null }), 5000);
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
    closeSettings: () => set({ showSettings: false }),
}));
