const WebSocket = require('ws');

class OrderBookClient {
    constructor(url = 'ws://localhost:3000') {
        this.url = url;
        this.ws = null;
        this.isConnected = false;
    }

    connect() {
        console.log(`Connecting to ${this.url}...`);
        
        this.ws = new WebSocket(this.url);
        
        this.ws.on('open', () => {
            console.log('Connected to OrderBook247 WebSocket');
            this.isConnected = true;
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            } catch (error) {
                console.error('Error parsing message:', error.message);
            }
        });

        this.ws.on('close', () => {
            console.log('Disconnected from OrderBook247 WebSocket');
            this.isConnected = false;
        });

        this.ws.on('error', (error) => {
            console.error('WebSocket error:', error.message);
        });
    }

    handleMessage(message) {
        switch (message.type) {
            case 'welcome':
                console.log('📨 Welcome:', message.message);
                break;

            case 'orderbooks_snapshot':
                console.log('📊 Received orderbooks snapshot:');
                this.displayOrderbooks(message.data);
                break;

            case 'orderbook_update':
                console.log(`🔄 Orderbook update for ${message.symbol}:`);
                this.displayOrderbook(message.symbol, message.data);
                break;

            case 'pong':
                console.log('🏓 Pong received');
                break;

            default:
                console.log('📨 Unknown message type:', message.type);
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
        
        console.log('\n   Bids:');
        orderbook.bids.slice(0, 5).forEach((bid, index) => {
            console.log(`     ${index + 1}. ${bid.price} (${bid.quantity})`);
        });

        console.log('\n   Asks:');
        orderbook.asks.slice(0, 5).forEach((ask, index) => {
            console.log(`     ${index + 1}. ${ask.price} (${ask.quantity})`);
        });
        console.log('');
    }

    subscribe(symbol) {
        if (!this.isConnected) {
            console.error('Not connected to WebSocket');
            return;
        }

        const message = {
            type: 'subscribe',
            symbol: symbol
        };

        this.ws.send(JSON.stringify(message));
        console.log(`Subscribed to ${symbol}`);
    }

    ping() {
        if (!this.isConnected) {
            console.error('Not connected to WebSocket');
            return;
        }

        const message = {
            type: 'ping'
        };

        this.ws.send(JSON.stringify(message));
        console.log('Ping sent');
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Example usage
if (require.main === module) {
    const client = new OrderBookClient();
    
    client.connect();
    
    // Subscribe to specific symbol after 2 seconds
    setTimeout(() => {
        client.subscribe('btcusdt');
    }, 2000);
    
    // Send ping every 30 seconds
    setInterval(() => {
        client.ping();
    }, 30000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down client...');
        client.disconnect();
        process.exit(0);
    });
}

module.exports = OrderBookClient; 