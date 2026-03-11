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
    // Simplified algorithm to find major local min/max
    const prices = data.map(d => d.y[3]);
    const sortedPrices = [...prices].sort((a, b) => a - b);
    
    // Support: near the lowest 10th percentile
    // Resistance: near the highest 90th percentile
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
        // Using Yahoo Finance Chart API through a CORS proxy
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1y&interval=1d`);
        const result = await response.json();
        
        if (!result.chart.result) throw new Error("Invalid Ticker");
        
        const data = result.chart.result[0];
        const timestamps = data.timestamp;
        const quotes = data.indicators.quote[0];
        const meta = data.meta;

        const chartData = timestamps.map((ts, i) => ({
            x: new Date(ts * 1000),
            y: [
                parseFloat(quotes.open[i]?.toFixed(2)), 
                parseFloat(quotes.high[i]?.toFixed(2)), 
                parseFloat(quotes.low[i]?.toFixed(2)), 
                parseFloat(quotes.close[i]?.toFixed(2))
            ]
        })).filter(d => d.y.every(v => v !== null && !isNaN(v)));

        renderChart(ticker, chartData, meta);
        updateUI(meta, quotes);
        
        loading.classList.add('hidden');
        stockInfo.classList.remove('hidden');
    } catch (error) {
        console.error(error);
        loading.classList.add('hidden');
        errorMsg.classList.remove('hidden');
    }
};

const updateUI = (meta, quotes) => {
    document.getElementById('stock-name').textContent = `${meta.symbol} - ${meta.exchangeName}`;
    const lastPrice = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    const diff = lastPrice - prevClose;
    const percent = (diff / prevClose) * 100;
    
    const priceEl = document.getElementById('current-price');
    const changeEl = document.getElementById('price-change');
    
    priceEl.textContent = `$${lastPrice.toLocaleString()}`;
    changeEl.textContent = `${diff.toFixed(2)} (${percent.toFixed(2)}%)`;
    changeEl.className = diff >= 0 ? 'up' : 'down';
};

const renderChart = (ticker, data, meta) => {
    const ma5 = calculateSMA(data, 5);
    const ma20 = calculateSMA(data, 20);
    const ma60 = calculateSMA(data, 60);
    const ma120 = calculateSMA(data, 120);
    const { support, resistance } = findSupportResistance(data);

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
            foreColor: getComputedStyle(document.body).getPropertyValue('--text-color'),
            toolbar: { show: true }
        },
        stroke: { width: [1, 2, 2, 2, 2], curve: 'smooth' },
        colors: ['#00c853', '#f44336', '#ffeb3b', '#4caf50', '#2196f3'], // Candle, MA5, MA20, MA60, MA120
        title: { text: `${ticker} 1Y Analysis`, align: 'left' },
        xaxis: { type: 'datetime' },
        yaxis: { tooltip: { enabled: true } },
        annotations: {
            yaxis: [
                {
                    y: resistance,
                    borderColor: '#ff5252',
                    label: { borderColor: '#ff5252', style: { color: '#fff', background: '#ff5252' }, text: `Resistance: ${resistance.toFixed(2)}` }
                },
                {
                    y: support,
                    borderColor: '#00c853',
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
        legend: { position: 'top', horizontalAlign: 'right' },
        tooltip: { shared: true, theme: document.body.getAttribute('data-theme') }
    };

    chart = new ApexCharts(document.querySelector("#chart-main"), options);
    chart.render();
};

// Event Listeners
document.getElementById('search-btn').addEventListener('click', () => {
    const ticker = document.getElementById('ticker-input').value.toUpperCase();
    if (ticker) fetchStockData(ticker);
});

document.getElementById('ticker-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const ticker = document.getElementById('ticker-input').value.toUpperCase();
        if (ticker) fetchStockData(ticker);
    }
});

// Theme Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    document.getElementById('theme-toggle').textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    
    // Re-fetch to update chart colors
    const ticker = document.getElementById('ticker-input').value.toUpperCase();
    if (ticker) fetchStockData(ticker);
});

// Initial Load
fetchStockData('AAPL');
