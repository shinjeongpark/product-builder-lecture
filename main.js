// main.js
let chart = null;

const calculateSMA = (data, period) => {
    let sma = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push({ x: data[i].x, y: null });
        } else {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].y[3]; // Closing price
            }
            sma.push({ x: data[i].x, y: parseFloat((sum / period).toFixed(2)) });
        }
    }
    return sma;
};

const findSupportResistance = (data) => {
    const prices = data.map(d => d.y[3]);
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const support = sortedPrices[Math.floor(prices.length * 0.05)];
    const resistance = sortedPrices[Math.floor(prices.length * 0.95)];
    return { support, resistance };
};

const fetchStockData = async (ticker) => {
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('error-msg');
    const stockInfo = document.getElementById('stock-info');
    
    loading.classList.remove('hidden');
    errorMsg.classList.add('hidden');
    stockInfo.classList.add('hidden');
    if (chart) chart.destroy();

    try {
        const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1y&interval=1d`;
        // Use allorigins proxy to bypass CORS
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        const json = await response.json();
        const result = JSON.parse(json.contents);
        
        if (!result.chart || !result.chart.result) {
            throw new Error("Invalid Ticker or No Data");
        }
        
        const data = result.chart.result[0];
        const timestamps = data.timestamp;
        const quotes = data.indicators.quote[0];
        const adjClose = data.indicators.adjclose ? data.indicators.adjclose[0].adjclose : quotes.close;
        const meta = data.meta;

        if (!timestamps || !quotes.open) throw new Error("Incomplete Data");

        const chartData = timestamps.map((ts, i) => {
            // Adjust OHLC by the ratio of adjClose/close to account for splits/dividends
            const ratio = adjClose[i] / quotes.close[i];
            return {
                x: new Date(ts * 1000),
                y: [
                    parseFloat((quotes.open[i] * ratio).toFixed(2)), 
                    parseFloat((quotes.high[i] * ratio).toFixed(2)), 
                    parseFloat((quotes.low[i] * ratio).toFixed(2)), 
                    parseFloat((adjClose[i]).toFixed(2))
                ]
            };
        }).filter(d => d.y.every(v => v !== null && !isNaN(v)));

        if (chartData.length === 0) throw new Error("No valid data points");

        renderChart(ticker, chartData, meta);
        updateUI(meta);
        
        loading.classList.add('hidden');
        stockInfo.classList.remove('hidden');
    } catch (error) {
        console.error("Fetch Error:", error);
        loading.classList.add('hidden');
        errorMsg.classList.remove('hidden');
    }
};

const updateUI = (meta) => {
    document.getElementById('stock-name').textContent = `${meta.symbol} - ${meta.fullExchangeName || meta.exchangeName}`;
    const lastPrice = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    const diff = lastPrice - prevClose;
    const percent = (diff / prevClose) * 100;
    
    const priceEl = document.getElementById('current-price');
    const changeEl = document.getElementById('price-change');
    
    priceEl.textContent = `${meta.currency === 'USD' ? '$' : ''}${lastPrice.toLocaleString()}`;
    changeEl.textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} (${percent.toFixed(2)}%)`;
    changeEl.className = diff >= 0 ? 'up' : 'down';
};

const renderChart = (ticker, data, meta) => {
    const ma5 = calculateSMA(data, 5);
    const ma20 = calculateSMA(data, 20);
    const ma60 = calculateSMA(data, 60);
    const ma120 = calculateSMA(data, 120);
    const { support, resistance } = findSupportResistance(data);

    const isDark = document.body.getAttribute('data-theme') === 'dark';

    const options = {
        series: [
            { name: 'Candle', type: 'candlestick', data: data },
            { name: 'MA5', type: 'line', data: ma5 },
            { name: 'MA20', type: 'line', data: ma20 },
            { name: 'MA60', type: 'line', data: ma60 },
            { name: 'MA120', type: 'line', data: ma120 }
        ],
        chart: {
            height: 600,
            type: 'line',
            background: 'transparent',
            foreColor: isDark ? '#e0e0e0' : '#2c3e50',
            toolbar: { show: true },
            zoom: { enabled: true }
        },
        stroke: { 
            width: [1, 2, 2, 2, 2],
            dashArray: [0, 0, 0, 0, 0]
        },
        colors: ['#00c853', '#f44336', '#ffeb3b', '#4caf50', '#2196f3'],
        xaxis: { 
            type: 'datetime',
            labels: { datetimeUTC: false }
        },
        yaxis: { 
            tooltip: { enabled: true },
            labels: { formatter: (val) => val.toFixed(2) }
        },
        annotations: {
            yaxis: [
                {
                    y: resistance,
                    borderColor: '#ff5252',
                    strokeDashArray: 4,
                    label: { borderColor: '#ff5252', style: { color: '#fff', background: '#ff5252' }, text: `Resistance: ${resistance.toFixed(2)}` }
                },
                {
                    y: support,
                    borderColor: '#00c853',
                    strokeDashArray: 4,
                    label: { borderColor: '#00c853', style: { color: '#fff', background: '#00c853' }, text: `Support: ${support.toFixed(2)}` }
                }
            ]
        },
        plotOptions: {
            candlestick: {
                colors: { upward: '#00c853', downward: '#ff5252' },
                wick: { useFillColor: true }
            }
        },
        legend: { 
            position: 'top', 
            horizontalAlign: 'right',
            labels: { colors: isDark ? '#e0e0e0' : '#2c3e50' }
        },
        tooltip: { 
            shared: true, 
            theme: isDark ? 'dark' : 'light',
            x: { format: 'dd MMM yyyy' }
        }
    };

    const container = document.querySelector("#chart-main");
    container.innerHTML = ''; // Clear previous chart
    chart = new ApexCharts(container, options);
    chart.render();
};

// Event Listeners
document.getElementById('search-btn').onclick = () => {
    const ticker = document.getElementById('ticker-input').value.trim().toUpperCase();
    if (ticker) fetchStockData(ticker);
};

document.getElementById('ticker-input').onkeypress = (e) => {
    if (e.key === 'Enter') {
        const ticker = document.getElementById('ticker-input').value.trim().toUpperCase();
        if (ticker) fetchStockData(ticker);
    }
};

document.getElementById('theme-toggle').onclick = () => {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    document.getElementById('theme-toggle').textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    
    // Refresh chart to apply new theme colors
    const ticker = document.getElementById('ticker-input').value.trim().toUpperCase();
    if (ticker) fetchStockData(ticker);
};

// Initial Load
fetchStockData('AAPL');
