# OrderBook247 📊

A real-time orderbook server that maintains live orderbook data from Binance Futures using WebSocket connections. Provides comprehensive market depth analysis, accumulated quantity calculations, and market impact analysis.

## 🚀 Features

- **Real-time Orderbook**: Live orderbook data from Binance Futures at 100ms frequency
- **Full Market Depth**: Maintains ALL price levels (not just top 20)
- **Accumulated Quantity Analysis**: Calculate total cost to move price to any level
- **Market Impact Analysis**: Estimate slippage and execution costs for large orders
- **Liquidity Profiling**: Detailed liquidity analysis at different price levels
- **WebSocket API**: Real-time orderbook updates for clients
- **REST API**: Query orderbook data, statistics, and calculations
- **Multiple Trading Pairs**: Support for BTCUSDT, ETHUSDT, BNBUSDT (configurable)
- **Robust Error Handling**: Automatic reconnection and sequence number validation

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd orderbook247
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your preferred settings
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
# Binance API Configuration
BINANCE_WS_URL=wss://fstream.binance.com/ws
BINANCE_REST_URL=https://fapi.binance.com

# Trading pairs to monitor (comma-separated)
TRADING_PAIRS=btcusdt,ethusdt,bnbusdt

# Server Configuration
PORT=3000
LOG_LEVEL=info

# Orderbook depth (default: 1000 for full depth)
ORDERBOOK_DEPTH=1000
```

## 📡 API Endpoints

### Health Check
```http
GET /health
```
Returns server health status and connection information.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 12345,
    "orderbooks": {
      "btcusdt": { "bidCount": 2501, "askCount": 2095 },
      "ethusdt": { "bidCount": 2060, "askCount": 1807 }
    },
    "binanceConnection": "connected"
  }
}
```

### Get All Orderbooks
```http
GET /api/orderbooks
```
Returns orderbook data for all configured trading pairs.

**Response:**
```json
{
  "success": true,
  "data": {
    "btcusdt": {
      "symbol": "btcusdt",
      "lastUpdateId": 8269959226532,
      "bids": [...],
      "asks": [...],
      "spread": -83.3,
      "midPrice": 116367.35,
      "totalBids": 2501,
      "totalAsks": 2095
    }
  }
}
```

### Get Specific Orderbook (All Levels)
```http
GET /api/orderbooks/{symbol}
```
Returns complete orderbook for a specific trading pair.

**Parameters:**
- `symbol`: Trading pair symbol (e.g., `btcusdt`, `ethusdt`)

### Get Limited Orderbook Levels
```http
GET /api/orderbooks/{symbol}/limit/{n}
```
Returns top N levels of orderbook for a specific trading pair.

**Parameters:**
- `symbol`: Trading pair symbol
- `n`: Number of levels to return (1-1000)

### Accumulated Quantity Analysis
```http
GET /api/orderbooks/{symbol}/acc-qty/{price}?side={bids|asks|both}
```
Calculate accumulated quantity and cost to reach a specific price level.

**Parameters:**
- `symbol`: Trading pair symbol
- `price`: Target price level
- `side`: `bids`, `asks`, or `both` (default: `both`)

**Response:**
```json
{
  "success": true,
  "data": {
    "targetPrice": 116000,
    "bids": {
      "quantity": 386.18,
      "cost": 44947198.68,
      "averagePrice": 116388.04
    },
    "asks": {
      "quantity": 0,
      "cost": 0,
      "averagePrice": 0
    },
    "total": {
      "quantity": 386.18,
      "cost": 44947198.68,
      "averagePrice": 116388.04
    }
  }
}
```

### Market Impact Analysis
```http
GET /api/orderbooks/{symbol}/market-impact/{size}?side={buy|sell}
```
Calculate market impact, slippage, and execution details for a given order size.

**Parameters:**
- `symbol`: Trading pair symbol
- `size`: Order size in base currency
- `side`: `buy` or `sell` (default: `buy`)

**Response:**
```json
{
  "success": true,
  "data": {
    "orderSize": 100,
    "side": "buy",
    "totalCost": 11648780,
    "averagePrice": 116487.8,
    "finalPrice": 116487.8,
    "remainingSize": 0,
    "filledSize": 100,
    "levelsConsumed": [...],
    "slippage": 0.012,
    "canFill": true
  }
}
```

### Liquidity Profile
```http
GET /api/orderbooks/{symbol}/liquidity-profile?levels={n}
```
Get detailed liquidity profile with accumulated quantities at each level.

**Parameters:**
- `symbol`: Trading pair symbol
- `levels`: Number of levels to analyze (1-100, default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "bids": [
      {
        "price": 116520.9,
        "quantity": 0.002,
        "accumulatedQuantity": 0.002,
        "accumulatedCost": 233.04,
        "averagePrice": 116520.9
      }
    ],
    "asks": [...],
    "timestamp": 1754580044350
  }
}
```

### Server Statistics
```http
GET /api/stats
```
Returns comprehensive server statistics and orderbook metrics.

## 🔌 WebSocket API

Connect to the WebSocket server for real-time orderbook updates:

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Orderbook update:', data);
};
```

### WebSocket Message Types

1. **Welcome Message**
   ```json
   {
     "type": "welcome",
     "message": "Connected to OrderBook247 WebSocket"
   }
   ```

2. **Orderbook Snapshot**
   ```json
   {
     "type": "orderbook_snapshot",
     "data": {
       "btcusdt": { /* orderbook data */ },
       "ethusdt": { /* orderbook data */ }
     }
   }
   ```

3. **Orderbook Update**
   ```json
   {
     "type": "orderbook_update",
     "symbol": "btcusdt",
     "data": { /* updated orderbook */ }
   }
   ```

## 📊 Data Structures

### Price Level
```json
{
  "price": 116521.9,
  "quantity": 2.124,
  "count": 1,
  "timestamp": 1754580044350
}
```

- `price`: Price level
- `quantity`: Total quantity at this price
- `count`: Number of individual orders at this price
- `timestamp`: Last update timestamp

### Orderbook Snapshot
```json
{
  "symbol": "btcusdt",
  "lastUpdateId": 8269959226532,
  "lastUpdateTime": 1754579797436,
  "bids": [...],
  "asks": [...],
  "spread": -83.3,
  "midPrice": 116367.35,
  "totalBids": 2501,
  "totalAsks": 2095
}
```

## 🧪 Examples

### Node.js REST Client
```javascript
const https = require('https');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

// Get BTC orderbook
makeRequest('/api/orderbooks/btcusdt')
  .then(data => console.log('BTC Orderbook:', data));

// Calculate market impact for 50 BTC buy order
makeRequest('/api/orderbooks/btcusdt/market-impact/50?side=buy')
  .then(data => console.log('Market Impact:', data));
```

### WebSocket Client
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('Connected to OrderBook247');
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message.type);
});
```

## 🔧 Development

### Available Scripts
- `npm start`: Start the production server
- `npm run dev`: Start development server with auto-reload
- `npm test`: Run tests
- `npm run test:watch`: Run tests in watch mode

### Project Structure
```
orderbook247/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Data models (OrderBook, PriceLevel)
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── examples/            # Client examples
├── test/               # Test files
├── start.js            # Server startup script
└── package.json
```

## 📈 Performance

- **Real-time Updates**: 100ms frequency from Binance
- **Low Latency**: WebSocket-based communication
- **High Throughput**: Efficient Map-based storage for O(1) lookups
- **Memory Efficient**: Automatic cleanup of stale price levels
- **Scalable**: Support for multiple trading pairs

## 🔒 Error Handling

- **Automatic Reconnection**: WebSocket reconnection on connection loss
- **Sequence Validation**: Robust sequence number validation for data integrity
- **Graceful Degradation**: Continues operation with partial data
- **Comprehensive Logging**: Detailed logs for debugging and monitoring

## 📝 Logging

Logs are written to:
- `combined.log`: All log levels
- `error.log`: Error-level logs only
- Console: Colored output for development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the logs for error details
2. Verify your configuration
3. Ensure Binance API is accessible
4. Create an issue with detailed information

---

**OrderBook247** - Professional-grade real-time orderbook analysis 🚀 