module.exports = {
    wsUrl: process.env.BINANCE_WS_URL || 'wss://fstream.binance.com/ws',
    restUrl: process.env.BINANCE_REST_URL || 'https://fapi.binance.com',
    tradingPairs: (process.env.TRADING_PAIRS || 'btcusdt,ethusdt,solusdt').split(','),
    orderbookDepth: parseInt(process.env.ORDERBOOK_DEPTH) || 1000, // Keep all levels
    
    getDepthStream: (symbol) => `${symbol}@depth@100ms`, // Full depth stream
    getDepthSnapshotUrl: (symbol, limit) => 
        `${this.restUrl}/fapi/v1/depth?symbol=${symbol.toUpperCase()}&limit=${limit}`,
    
    // WebSocket message types
    messageTypes: {
        DEPTH_UPDATE: 'depthUpdate',
        SNAPSHOT: 'snapshot'
    }
}; 