# 🤖 AI Crypto Trader

An AI-powered cryptocurrency trading bot with Binance Testnet integration. This webapp uses technical indicators and Google Gemini AI to analyze market conditions and make trading decisions.

![AI Crypto Trader](https://via.placeholder.com/800x400?text=AI+Crypto+Trader)

## ✨ Features

- **Real-time Market Data**: Live price updates from Binance Testnet
- **Technical Analysis**: RSI, MACD, Bollinger Bands, Stochastic, ATR, and more
- **AI-Powered Decisions**: Google Gemini AI analyzes indicators and provides trading recommendations
- **Trade Execution**: Place market and limit orders directly from the interface
- **Portfolio Tracking**: View your testnet balances and trade history
- **Beautiful UI**: Modern glassmorphism design with real-time animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Binance Testnet API keys ([Get them here](https://testnet.binance.vision))
- Google Gemini API key ([Get it here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   cd auto_trade
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Edit `.env` file and add your API keys:
   ```env
   BINANCE_API_KEY=your_binance_testnet_api_key
   BINANCE_SECRET_KEY=your_binance_testnet_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Technical Indicators

The bot calculates the following indicators:

| Indicator | Description |
|-----------|-------------|
| RSI (14) | Relative Strength Index - measures momentum |
| MACD | Moving Average Convergence Divergence |
| Bollinger Bands | Volatility and price levels |
| Stochastic | Overbought/oversold conditions |
| ATR | Average True Range - volatility measure |
| SMA 20/50 | Simple Moving Averages for trend |
| EMA 12/26 | Exponential Moving Averages |
| VWAP | Volume Weighted Average Price |

## 🤖 AI Integration

The bot uses Google Gemini AI to analyze:
- Technical indicator readings
- Price action patterns
- Market momentum
- Risk/reward calculations

The AI provides:
- BUY/SELL/HOLD recommendations
- Confidence score (0-100%)
- Stop loss and take profit levels
- Key factors influencing the decision

## ⚠️ Disclaimer

**This is a demo application using Binance Testnet. No real money is involved.**

- Only use this for educational purposes
- Never trade with money you can't afford to lose
- Past performance is not indicative of future results
- AI predictions are not financial advice

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **AI**: Google Gemini AI
- **Exchange**: Binance Testnet API
- **State Management**: Zustand
- **Charts**: Custom SVG charts

## 📁 Project Structure

```
auto_trade/
├── src/
│   ├── components/       # React components
│   │   ├── Header.jsx
│   │   ├── PriceChart.jsx
│   │   ├── IndicatorPanel.jsx
│   │   ├── TradePanel.jsx
│   │   ├── TradeHistory.jsx
│   │   ├── BalanceCard.jsx
│   │   └── ...
│   ├── lib/              # Utilities
│   │   ├── binance.js    # Binance API client
│   │   ├── indicators.js # Technical indicators
│   │   ├── gemini.js     # Gemini AI integration
│   │   └── store.js      # State management
│   ├── pages/            # Next.js pages
│   │   ├── api/          # API routes
│   │   │   ├── market/
│   │   │   ├── account/
│   │   │   └── trading/
│   │   └── index.js      # Main dashboard
│   └── styles/
│       └── globals.css   # Global styles
├── .env                  # Environment variables
├── package.json
└── README.md
```

## 🚀 Deployment (Vercel + Persistence)

This bot is optimized for deployment on **Vercel** with background persistence using **Prisma** and **GitHub Actions**.

### 1. Database Setup
You need a Postgres database to store trade history and bot state:
- Create a project on [Vercel](https://vercel.com).
- Go to the **Storage** tab and create a **Vercel Postgres** database.
- Connect it to your project. Vercel will set `POSTGRES_PRISMA_URL` and `DATABASE_URL` for you.

### 2. Cron Jobs (Background Trading)
Since Vercel Hobby plan limits native crons to 1x daily, we use **GitHub Actions** to trigger the bot every 5 minutes:
1. Go to your GitHub Repo **Settings** > **Secrets and variables** > **Actions**.
2. Add a **New repository secret**:
   - Name: `CRON_SECRET`
   - Value: `your_secret_password`
3. Add the same `CRON_SECRET` to your **Vercel Environment Variables**.

### 3. Environment Variables
Set these in Vercel:
- `BINANCE_API_KEY`
- `BINANCE_SECRET_KEY`
- `GEMINI_API_KEY`
- `DATABASE_URL`
- `CRON_SECRET`

### 4. Database Migration
In your local terminal (ensure `.env` has the production `DATABASE_URL` temporarily):
```bash
npx prisma db push
```

## 🔐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market/data` | GET | Fetch market data and indicators |
| `/api/account/balance` | GET | Get account balances |
| `/api/account/trades` | GET | Get trade history |
| `/api/trading/analyze` | POST | AI market analysis |
| `/api/trading/execute` | POST | Execute trade |
| `/api/trading/orders` | GET/DELETE | Manage orders |
| `/api/trading/auto` | GET/POST | Auto-trading state & logs |
| `/api/cron/trade` | POST | Background trade trigger (via GitHub Actions) |

## 📄 License

MIT License - Feel free to use this for learning and experimentation.

---

Made with ❤️ for crypto enthusiasts and AI developers
