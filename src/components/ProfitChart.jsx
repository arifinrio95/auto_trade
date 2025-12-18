import { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

export default function ProfitChart({ trades }) {
    const data = useMemo(() => {
        if (!trades || trades.length === 0) return [];

        // Sort trades by time ascending
        const sortedTrades = [...trades].sort((a, b) => new Date(a.time) - new Date(b.time));

        let cumulativePnL = 0;
        let inventory = []; // Queue of {price, qty}
        const points = [];

        // Initial point
        points.push({
            time: sortedTrades[0].time,
            value: 0
        });

        sortedTrades.forEach(trade => {
            const price = parseFloat(trade.price);
            const qty = parseFloat(trade.quantity);
            const time = trade.time;

            if (trade.side === 'BUY') {
                inventory.push({ price, qty });
            } else if (trade.side === 'SELL') {
                let remainingQtyToSell = qty;
                let tradePnL = 0;

                while (remainingQtyToSell > 0 && inventory.length > 0) {
                    const batch = inventory[0];
                    const sellFromBatch = Math.min(batch.qty, remainingQtyToSell);

                    const profit = (price - batch.price) * sellFromBatch;
                    tradePnL += profit;

                    batch.qty -= sellFromBatch;
                    remainingQtyToSell -= sellFromBatch;

                    if (batch.qty <= 0.00000001) {
                        inventory.shift(); // Remove used up batch
                    }
                }

                // If we sold more than we had (shorting?), or just data mismatch, 
                // we treat rest as opening short (profit from price drop usually)
                // specific logic for simple spot: just ignore or assume 0 cost if missing history?
                // For simplicity, we mostly track realized from known buys.

                cumulativePnL += tradePnL;

                points.push({
                    time,
                    value: cumulativePnL
                });
            }
        });

        return points;
    }, [trades]);

    if (data.length === 0) {
        return (
            <div className="card h-64 flex items-center justify-center text-gray-400 text-sm">
                No closed trades to chart P&L
            </div>
        );
    }

    const isPositive = data[data.length - 1]?.value >= 0;
    const gradientId = "pnlGradient";

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900">Cumulative P&L</h3>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isPositive ? "#34C759" : "#FF3B30"} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={isPositive ? "#34C759" : "#FF3B30"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                        <XAxis
                            dataKey="time"
                            tickFormatter={(t) => format(new Date(t), 'HH:mm')}
                            stroke="#86868B"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#86868B"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `$${val.toFixed(2)}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                            labelFormatter={(t) => format(new Date(t), 'PP HH:mm')}
                            formatter={(value) => [`$${value.toFixed(2)}`, 'Profit']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={isPositive ? "#34C759" : "#FF3B30"}
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
