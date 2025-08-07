const https = require('https');
const http = require('http');

class RestClient {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
    }

    async makeRequest(path, method = 'GET') {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const client = url.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = client.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve({
                            statusCode: res.statusCode,
                            data: response
                        });
                    } catch (error) {
                        reject(new Error(`Error parsing response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request error: ${error.message}`));
            });

            req.end();
        });
    }

    async getHealth() {
        try {
            const response = await this.makeRequest('/health');
            console.log('🏥 Health Check:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            throw error;
        }
    }

    async getAllOrderbooks() {
        try {
            const response = await this.makeRequest('/api/orderbooks');
            console.log('📊 All Orderbooks:');
            this.displayOrderbooks(response.data.data);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to get orderbooks:', error.message);
            throw error;
        }
    }

    async getOrderbook(symbol) {
        try {
            const response = await this.makeRequest(`/api/orderbooks/${symbol}`);
            console.log(`📈 Orderbook for ${symbol.toUpperCase()}:`);
            this.displayOrderbook(symbol, response.data.data);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to get orderbook for ${symbol}:`, error.message);
            throw error;
        }
    }

    async getStats() {
        try {
            const response = await this.makeRequest('/api/stats');
            console.log('📊 Server Stats:');
            this.displayStats(response.data.data);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to get stats:', error.message);
            throw error;
        }
    }

    displayOrderbooks(orderbooks) {
        for (const [symbol, orderbook] of Object.entries(orderbooks)) {
            this.displayOrderbook(symbol, orderbook);
        }
    }

    displayOrderbook(symbol, orderbook) {
        console.log(`\n📈 ${symbol.toUpperCase()} Orderbook:`);
        console.log(`   Last Update ID: ${orderbook.lastUpdateId}`);
        console.log(`   Spread: ${orderbook.spread}`);
        console.log(`   Mid Price: ${orderbook.midPrice}`);
        
        console.log('\n   Top 5 Bids:');
        orderbook.bids.slice(0, 5).forEach((bid, index) => {
            console.log(`     ${index + 1}. ${bid.price} (${bid.quantity})`);
        });

        console.log('\n   Top 5 Asks:');
        orderbook.asks.slice(0, 5).forEach((ask, index) => {
            console.log(`     ${index + 1}. ${ask.price} (${ask.quantity})`);
        });
        console.log('');
    }

    displayStats(stats) {
        console.log(`\n🖥️  Server Info:`);
        console.log(`   Uptime: ${Math.floor(stats.server.uptime)}s`);
        console.log(`   Memory: ${Math.round(stats.server.memory.heapUsed / 1024 / 1024)}MB`);
        
        console.log(`\n📊 Orderbook Manager:`);
        console.log(`   Total Orderbooks: ${stats.orderbookManager.totalOrderbooks}`);
        console.log(`   Total Subscribers: ${stats.orderbookManager.totalSubscribers}`);
        console.log(`   Symbols: ${stats.orderbookManager.symbols.join(', ')}`);
        
        console.log(`\n🔌 Binance WebSocket:`);
        console.log(`   Connected: ${stats.binanceWebSocket.connected}`);
        console.log(`   Subscribed Streams: ${stats.binanceWebSocket.subscribedStreams.join(', ')}`);
        console.log(`   Reconnect Attempts: ${stats.binanceWebSocket.reconnectAttempts}`);
        
        console.log(`\n📈 Orderbook Details:`);
        for (const [symbol, details] of Object.entries(stats.orderbookManager.orderbooks)) {
            console.log(`   ${symbol.toUpperCase()}:`);
            console.log(`     Last Update ID: ${details.lastUpdateId}`);
            console.log(`     Bid Count: ${details.bidCount}`);
            console.log(`     Ask Count: ${details.askCount}`);
            console.log(`     Spread: ${details.spread}`);
            console.log(`     Mid Price: ${details.midPrice}`);
        }
        console.log('');
    }
}

// Example usage
if (require.main === module) {
    const client = new RestClient();
    
    async function runExample() {
        try {
            // Check server health
            await client.getHealth();
            
            // Wait a bit for orderbooks to initialize
            console.log('⏳ Waiting for orderbooks to initialize...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Get all orderbooks
            await client.getAllOrderbooks();
            
            // Get specific orderbook
            await client.getOrderbook('btcusdt');
            
            // Get server stats
            await client.getStats();
            
        } catch (error) {
            console.error('❌ Example failed:', error.message);
        }
    }
    
    runExample();
}

module.exports = RestClient; 