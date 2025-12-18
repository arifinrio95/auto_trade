import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget({ symbol = 'BTCUSDT' }) {
    const container = useRef();

    // Map Binance symbol to TradingView format if necessary
    // e.g., BTCUSDT -> BINANCE:BTCUSDT
    const tvSymbol = symbol.includes(':') ? symbol : `BINANCE:${symbol}`;

    useEffect(
        () => {
            // Clear container before adding new script to prevent duplicates on symbol change
            if (container.current) {
                container.current.innerHTML = '';
                const widgetDiv = document.createElement("div");
                widgetDiv.className = "tradingview-widget-container__widget";
                widgetDiv.style.height = "calc(100% - 32px)";
                widgetDiv.style.width = "100%";
                container.current.appendChild(widgetDiv);
            }

            const script = document.createElement("script");
            script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
            script.type = "text/javascript";
            script.async = true;
            script.innerHTML = `
        {
          "allow_symbol_change": true,
          "calendar": false,
          "details": false,
          "hide_side_toolbar": false,
          "hide_top_toolbar": false,
          "hide_legend": false,
          "hide_volume": false,
          "hotlist": false,
          "interval": "60",
          "locale": "en",
          "save_image": true,
          "style": "1",
          "symbol": "${tvSymbol}",
          "theme": "dark",
          "timezone": "Etc/UTC",
          "backgroundColor": "#0F0F0F",
          "gridColor": "rgba(242, 242, 242, 0.06)",
          "watchlist": [],
          "withdateranges": true,
          "compareSymbols": [],
          "studies": [
            "RSI@tv-basicstudies",
            "MASimple@tv-basicstudies"
          ],
          "autosize": true
        }`;
            container.current.appendChild(script);
        },
        [tvSymbol]
    );

    return (
        <div className="tradingview-widget-container" ref={container} style={{ height: "500px", width: "100%" }}>
            <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
            <div className="tradingview-widget-copyright" style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                <a href={`https://www.tradingview.com/symbols/${tvSymbol.replace(':', '-')}/`} rel="noopener nofollow" target="_blank">
                    <span className="blue-text">{symbol} Chart</span>
                </a> by TradingView
            </div>
        </div>
    );
}

export default memo(TradingViewWidget);
