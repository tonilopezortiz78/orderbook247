#!/usr/bin/env node

require('dotenv').config();
const logger = require('./src/utils/logger');
const config = require('./src/config/binance');

console.log('🚀 Starting OrderBook247...');
console.log(`📊 Trading pairs: ${config.tradingPairs.join(', ')}`);
console.log(`🔗 Binance WebSocket: ${config.wsUrl}`);
console.log(`🌐 Server port: ${process.env.PORT || 3000}`);
console.log('');

// Start the server
const server = require('./src/server');

// Add startup completion message
setTimeout(() => {
    console.log('');
    console.log('✅ OrderBook247 is ready!');
    console.log(`📈 REST API: http://localhost:${process.env.PORT || 3000}/api`);
    console.log(`🔌 WebSocket: ws://localhost:${process.env.PORT || 3000}`);
    console.log(`🏥 Health check: http://localhost:${process.env.PORT || 3000}/health`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
}, 5000);
