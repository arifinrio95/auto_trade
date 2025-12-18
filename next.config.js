/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        BINANCE_API_KEY: process.env.BINANCE_API_KEY,
        BINANCE_SECRET_KEY: process.env.BINANCE_SECRET_KEY,
        BINANCE_TESTNET_URL: process.env.BINANCE_TESTNET_URL,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    },
}

module.exports = nextConfig
