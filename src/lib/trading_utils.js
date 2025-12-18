/**
 * Utility functions for trade calculation and matching
 */

/**
 * Calculates realized PnL for a list of trades using FIFO method
 * @param {Array} trades List of trades for a specific symbol
 * @returns {Array} List of trades with pnl field populated for EXIT trades
 */
export function calculateRealizedPnL(trades) {
    if (!trades || trades.length === 0) return [];

    // Sort by time ascending to process FIFO
    const sortedTrades = [...trades].sort((a, b) => new Date(a.time) - new Date(b.time));

    const buyQueue = [];
    const sellQueue = [];
    const results = sortedTrades.map(t => ({ ...t, pnl: null, status: 'OPEN' }));

    sortedTrades.forEach((trade, index) => {
        const side = trade.side.toUpperCase();
        const quantity = trade.quantity;
        const price = trade.price;

        if (side === 'BUY') {
            buyQueue.push({ index, remainingQty: quantity, price });
        } else {
            let pnl = 0;
            let remainingToSell = quantity;

            while (remainingToSell > 0 && buyQueue.length > 0) {
                const buy = buyQueue[0];
                const take = Math.min(remainingToSell, buy.remainingQty);

                // PnL = (Sell Price - Buy Price) * Quantity
                pnl += (price - buy.price) * take;

                remainingToSell -= take;
                buy.remainingQty -= take;

                if (buy.remainingQty <= 0) {
                    // This buy order is fully matched
                    results[buy.index].status = 'CLOSED';
                    buyQueue.shift();
                } else {
                    results[buy.index].status = 'PARTIALLY_CLOSED';
                }
            }

            // For the sell trade itself
            results[index].pnl = pnl;
            results[index].status = remainingToSell <= 0 ? 'EXIT' : 'PARTIAL_EXIT';
        }
    });

    // Final pass for statuses
    return results;
}
