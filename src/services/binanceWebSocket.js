const WebSocket = require('ws');
const https = require('https');
const logger = require('../utils/logger');
const config = require('../config/binance');
const Validators = require('../utils/validators');

class BinanceWebSocket {
    constructor(orderbookManager) {
        this.orderbookManager = orderbookManager;
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000;
        this.subscribedStreams = new Set();
    }

    async connect() {
        try {
            logger.info(`Connecting to Binance WebSocket: ${config.wsUrl}`);
            
            this.ws = new WebSocket(config.wsUrl);
            
            this.ws.on('open', () => {
                logger.info('Connected to Binance WebSocket');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.subscribeToStreams();
            });

            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(message);
                } catch (error) {
                    logger.error(`Error parsing WebSocket message: ${error.message}`);
                }
            });

            this.ws.on('close', () => {
                logger.warn('Binance WebSocket connection closed');
                this.isConnected = false;
                this.handleReconnect();
            });

            this.ws.on('error', (error) => {
                logger.error(`Binance WebSocket error: ${error.message}`);
                this.isConnected = false;
            });

        } catch (error) {
            logger.error(`Error connecting to Binance WebSocket: ${error.message}`);
            this.handleReconnect();
        }
    }

    subscribeToStreams() {
        // Wait a bit before subscribing to ensure orderbooks are initialized
        setTimeout(() => {
            for (const symbol of config.tradingPairs) {
                const stream = config.getDepthStream(symbol);
                this.subscribe(stream);
            }
        }, 2000);
    }

    subscribe(stream) {
        if (!this.isConnected) {
            logger.error('Cannot subscribe: WebSocket not connected');
            return;
        }

        const subscribeMessage = {
            method: 'SUBSCRIBE',
            params: [stream],
            id: Date.now()
        };

        this.ws.send(JSON.stringify(subscribeMessage));
        this.subscribedStreams.add(stream);
        logger.info(`Subscribed to stream: ${stream}`);
    }

    handleMessage(message) {
        // Handle subscription confirmation
        if (message.result === null && message.id) {
            logger.info(`Subscription confirmed for ID: ${message.id}`);
            return;
        }

        // Handle depth updates
        if (message.e === 'depthUpdate') {
            this.handleDepthUpdate(message);
            return;
        }

        // Handle error messages
        if (message.error) {
            logger.error(`Binance WebSocket error: ${JSON.stringify(message.error)}`);
            return;
        }

        // Log unknown message types
        if (message.e) {
            logger.debug(`Received message type: ${message.e}`);
        }
    }

    handleDepthUpdate(data) {
        if (!Validators.isValidDepthUpdate(data)) {
            logger.warn('Invalid depth update received');
            return;
        }

        const symbol = data.s.toLowerCase();
        const success = this.orderbookManager.updateOrderBook(symbol, data);
        
        if (!success) {
            logger.debug(`Update skipped for ${symbol} (likely sequence number mismatch)`);
        }
    }

    async getSnapshot(symbol) {
        return new Promise((resolve, reject) => {
            const url = config.getDepthSnapshotUrl(symbol, config.orderbookDepth);
            
            https.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const snapshot = JSON.parse(data);
                        resolve(snapshot);
                    } catch (error) {
                        reject(new Error(`Error parsing snapshot: ${error.message}`));
                    }
                });
            }).on('error', (error) => {
                reject(new Error(`Error fetching snapshot: ${error.message}`));
            });
        });
    }

    async initializeOrderbooks() {
        logger.info('Initializing orderbooks...');
        
        for (const symbol of config.tradingPairs) {
            try {
                logger.info(`Creating orderbook for ${symbol}...`);
                // Create empty orderbook first, let real-time updates populate it
                this.orderbookManager.createOrderBook(symbol);
                
                // Add delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                logger.error(`Error creating orderbook for ${symbol}: ${error.message}`);
            }
        }
        
        logger.info('Orderbook initialization completed - waiting for real-time updates');
    }

    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        logger.info('Disconnected from Binance WebSocket');
    }

    getStatus() {
        return {
            connected: this.isConnected,
            subscribedStreams: Array.from(this.subscribedStreams),
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

module.exports = BinanceWebSocket; 