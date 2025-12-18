import crypto from 'crypto-js';

const TESTNET_BASE_URL = 'https://testnet.binance.vision';
const TESTNET_WS_URL = 'wss://testnet.binance.vision/ws';

export class BinanceClient {
    constructor(apiKey, secretKey) {
        if (!apiKey || !secretKey) {
            console.error('BinanceClient Error: API Key or Secret Key is missing!', {
                hasApiKey: !!apiKey,
                hasSecretKey: !!secretKey
            });
        }
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.baseUrl = TESTNET_BASE_URL;
    }

    // Generate signature for authenticated requests
    generateSignature(queryString) {
        return crypto.HmacSHA256(queryString, this.secretKey).toString();
    }

    // Build query string from params
    buildQueryString(params) {
        return Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
    }

    // Public request (no auth needed)
    async publicRequest(endpoint, params = {}) {
        const queryString = this.buildQueryString(params);
        const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

        const response = await fetch(url);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.msg || 'Binance API Error');
        }
        return response.json();
    }

    // Signed request (auth required)
    async signedRequest(method, endpoint, params = {}) {
        const timestamp = Date.now();
        const queryParams = { ...params, timestamp };
        const queryString = this.buildQueryString(queryParams);
        const signature = this.generateSignature(queryString);

        const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;

        const response = await fetch(url, {
            method,
            headers: {
                'X-MBX-APIKEY': this.apiKey,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.msg || 'Binance API Error');
        }
        return response.json();
    }

    // Get server time
    async getServerTime() {
        return this.publicRequest('/api/v3/time');
    }

    // Get exchange info
    async getExchangeInfo() {
        return this.publicRequest('/api/v3/exchangeInfo');
    }

    // Get ticker price
    async getTickerPrice(symbol) {
        return this.publicRequest('/api/v3/ticker/price', { symbol });
    }

    // Get all ticker prices
    async getAllTickerPrices() {
        return this.publicRequest('/api/v3/ticker/price');
    }

    // Get 24h ticker stats
    async get24hTicker(symbol) {
        return this.publicRequest('/api/v3/ticker/24hr', { symbol });
    }

    // Get candlestick/kline data
    async getKlines(symbol, interval = '1h', limit = 100) {
        const data = await this.publicRequest('/api/v3/klines', {
            symbol,
            interval,
            limit,
        });

        // Transform to more usable format
        return data.map(candle => ({
            openTime: candle[0],
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]),
            closeTime: candle[6],
            quoteVolume: parseFloat(candle[7]),
            trades: candle[8],
        }));
    }

    // Get order book
    async getOrderBook(symbol, limit = 100) {
        return this.publicRequest('/api/v3/depth', { symbol, limit });
    }

    // Get recent trades
    async getRecentTrades(symbol, limit = 500) {
        return this.publicRequest('/api/v3/trades', { symbol, limit });
    }

    // ========== ACCOUNT ENDPOINTS (Signed) ==========

    // Get account info
    async getAccountInfo() {
        return this.signedRequest('GET', '/api/v3/account');
    }

    // Get account balances
    async getBalances() {
        const account = await this.getAccountInfo();
        return account.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
    }

    // Place a new order
    async placeOrder(symbol, side, type, quantity, price = null, options = {}) {
        const params = {
            symbol,
            side, // BUY or SELL
            type, // MARKET, LIMIT, etc.
            quantity: quantity.toString(),
            ...options,
        };

        if (type === 'LIMIT' && price) {
            params.price = price.toString();
            params.timeInForce = options.timeInForce || 'GTC';
        }

        return this.signedRequest('POST', '/api/v3/order', params);
    }

    // Place market order
    async placeMarketOrder(symbol, side, quantity) {
        return this.placeOrder(symbol, side, 'MARKET', quantity);
    }

    // Place limit order
    async placeLimitOrder(symbol, side, quantity, price) {
        return this.placeOrder(symbol, side, 'LIMIT', quantity, price);
    }

    // Cancel an order
    async cancelOrder(symbol, orderId) {
        return this.signedRequest('DELETE', '/api/v3/order', { symbol, orderId });
    }

    // Get open orders
    async getOpenOrders(symbol = null) {
        const params = symbol ? { symbol } : {};
        return this.signedRequest('GET', '/api/v3/openOrders', params);
    }

    // Get all orders
    async getAllOrders(symbol, limit = 500) {
        return this.signedRequest('GET', '/api/v3/allOrders', { symbol, limit });
    }

    // Get order status
    async getOrder(symbol, orderId) {
        return this.signedRequest('GET', '/api/v3/order', { symbol, orderId });
    }

    // Get my trades
    async getMyTrades(symbol, limit = 500) {
        return this.signedRequest('GET', '/api/v3/myTrades', { symbol, limit });
    }
}

// WebSocket manager for real-time data
export class BinanceWebSocket {
    constructor() {
        this.baseUrl = TESTNET_WS_URL;
        this.connections = new Map();
    }

    // Subscribe to ticker updates
    subscribeTicker(symbol, callback) {
        const wsUrl = `${this.baseUrl}/${symbol.toLowerCase()}@ticker`;
        return this.createConnection(`ticker_${symbol}`, wsUrl, callback);
    }

    // Subscribe to kline/candlestick updates
    subscribeKline(symbol, interval, callback) {
        const wsUrl = `${this.baseUrl}/${symbol.toLowerCase()}@kline_${interval}`;
        return this.createConnection(`kline_${symbol}_${interval}`, wsUrl, callback);
    }

    // Subscribe to trade updates
    subscribeTrades(symbol, callback) {
        const wsUrl = `${this.baseUrl}/${symbol.toLowerCase()}@trade`;
        return this.createConnection(`trade_${symbol}`, wsUrl, callback);
    }

    // Subscribe to mini ticker for all symbols
    subscribeAllMiniTicker(callback) {
        const wsUrl = `${this.baseUrl}/!miniTicker@arr`;
        return this.createConnection('allMiniTicker', wsUrl, callback);
    }

    createConnection(id, wsUrl, callback) {
        if (this.connections.has(id)) {
            this.connections.get(id).close();
        }

        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            callback(data);
        };

        ws.onerror = (error) => {
            console.error(`WebSocket error for ${id}:`, error);
        };

        ws.onclose = () => {
            console.log(`WebSocket closed for ${id}`);
            this.connections.delete(id);
        };

        this.connections.set(id, ws);
        return ws;
    }

    unsubscribe(id) {
        if (this.connections.has(id)) {
            this.connections.get(id).close();
            this.connections.delete(id);
        }
    }

    unsubscribeAll() {
        this.connections.forEach((ws) => ws.close());
        this.connections.clear();
    }
}

export default BinanceClient;
