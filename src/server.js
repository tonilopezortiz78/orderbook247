require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const logger = require('./utils/logger');
const OrderBookManager = require('./services/orderbookManager');
const BinanceWebSocket = require('./services/binanceWebSocket');

class OrderBookServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.orderbookManager = new OrderBookManager();
        this.binanceWebSocket = new BinanceWebSocket(this.orderbookManager);
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            try {
                const stats = this.orderbookManager.getStats();
                const config = require('./config/binance');
                res.json({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    orderbooks: {
                        total: stats.totalOrderbooks,
                        symbols: stats.symbols,
                        initialized: stats.totalOrderbooks === config.tradingPairs.length
                    },
                    binance: {
                        connected: this.binanceWebSocket.isConnected,
                        streams: this.binanceWebSocket.subscribedStreams.size
                    }
                });
            } catch (error) {
                logger.error(`Health check error: ${error.message}`);
                res.status(500).json({
                    status: 'error',
                    error: error.message
                });
            }
        });

        // Get all orderbooks
        this.app.get('/api/orderbooks', (req, res) => {
            try {
                const orderbooks = this.orderbookManager.getAllOrderBooks();
                res.json({
                    success: true,
                    data: orderbooks,
                    timestamp: Date.now()
                });
            } catch (error) {
                logger.error(`Error getting orderbooks: ${error.message}`);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        });

        // Get specific orderbook (all levels)
        this.app.get('/api/orderbooks/:symbol', (req, res) => {
            try {
                const symbol = req.params.symbol.toLowerCase();
                const orderbook = this.orderbookManager.getOrderBook(symbol);
                
                if (!orderbook) {
                    return res.status(404).json({
                        success: false,
                        error: `Orderbook not found for symbol: ${symbol}`
                    });
                }

                res.json({
                    success: true,
                    data: orderbook.getSnapshot(),
                    timestamp: Date.now()
                });
            } catch (error) {
                logger.error(`Error getting orderbook: ${error.message}`);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        });

        // Get specific orderbook with limit
        this.app.get('/api/orderbooks/:symbol/limit/:limit', (req, res) => {
            try {
                const symbol = req.params.symbol.toLowerCase();
                const limit = parseInt(req.params.limit);
                const orderbook = this.orderbookManager.getOrderBook(symbol);
                
                if (!orderbook) {
                    return res.status(404).json({
                        success: false,
                        error: `Orderbook not found for symbol: ${symbol}`
                    });
                }

                if (isNaN(limit) || limit < 1) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid limit parameter'
                    });
                }

                res.json({
                    success: true,
                    data: orderbook.getSnapshot(limit),
                    timestamp: Date.now()
                });
            } catch (error) {
                logger.error(`Error getting orderbook: ${error.message}`);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        });

        // Get accumulated quantity to reach a specific price
        this.app.get('/api/orderbooks/:symbol/acc-qty/:price', (req, res) => {
            try {
                const symbol = req.params.symbol.toLowerCase();
                const targetPrice = parseFloat(req.params.price);
                const side = req.query.side || 'both'; // 'bids', 'asks', or 'both'
                const orderbook = this.orderbookManager.getOrderBook(symbol);
                
                if (!orderbook) {
                    return res.status(404).json({
                        success: false,
                        error: `Orderbook not found for symbol: ${symbol}`
                    });
                }

                if (isNaN(targetPrice) || targetPrice <= 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid price parameter'
                    });
                }

                const accQty = orderbook.getAccumulatedQuantityToPrice(targetPrice, side);

                res.json({
                    success: true,
                    data: accQty,
                    timestamp: Date.now()
                });
            } catch (error) {
                logger.error(`Error calculating accumulated quantity: ${error.message}`);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        });

        // Calculate market impact for a given order size
        this.app.get('/api/orderbooks/:symbol/market-impact/:size', (req, res) => {
            try {
                const symbol = req.params.symbol.toLowerCase();
                const orderSize = parseFloat(req.params.size);
                const side = req.query.side || 'buy'; // 'buy' or 'sell'
                const orderbook = this.orderbookManager.getOrderBook(symbol);
                
                if (!orderbook) {
                    return res.status(404).json({
                        success: false,
                        error: `Orderbook not found for symbol: ${symbol}`
                    });
                }

                if (isNaN(orderSize) || orderSize <= 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid order size parameter'
                    });
                }

                const marketImpact = orderbook.getMarketImpact(orderSize, side);

                res.json({
                    success: true,
                    data: marketImpact,
                    timestamp: Date.now()
                });
            } catch (error) {
                logger.error(`Error calculating market impact: ${error.message}`);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        });

        // Get liquidity profile
        this.app.get('/api/orderbooks/:symbol/liquidity-profile', (req, res) => {
            try {
                const symbol = req.params.symbol.toLowerCase();
                const levels = parseInt(req.query.levels) || 10;
                const orderbook = this.orderbookManager.getOrderBook(symbol);
                
                if (!orderbook) {
                    return res.status(404).json({
                        success: false,
                        error: `Orderbook not found for symbol: ${symbol}`
                    });
                }

                if (isNaN(levels) || levels < 1 || levels > 100) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid levels parameter (1-100)'
                    });
                }

                const liquidityProfile = orderbook.getLiquidityProfile(levels);

                res.json({
                    success: true,
                    data: liquidityProfile,
                    timestamp: Date.now()
                });
            } catch (error) {
                logger.error(`Error getting liquidity profile: ${error.message}`);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        });

        // Get server stats
        this.app.get('/api/stats', (req, res) => {
            try {
                const stats = {
                    orderbookManager: this.orderbookManager.getStats(),
                    binanceWebSocket: this.binanceWebSocket.getStatus(),
                    server: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        timestamp: Date.now()
                    }
                };

                res.json({
                    success: true,
                    data: stats
                });
            } catch (error) {
                logger.error(`Error getting stats: ${error.message}`);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        });

        // Error handler
        this.app.use((error, req, res, next) => {
            logger.error(`Unhandled error: ${error.message}`);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found'
            });
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            logger.info(`New WebSocket connection from ${req.socket.remoteAddress}`);
            
            // Add client to orderbook manager subscribers
            this.orderbookManager.addSubscriber(ws);

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                message: 'Connected to OrderBook247 WebSocket',
                timestamp: Date.now()
            }));

            // Send current orderbooks
            const orderbooks = this.orderbookManager.getAllOrderBooks();
            ws.send(JSON.stringify({
                type: 'orderbooks_snapshot',
                data: orderbooks,
                timestamp: Date.now()
            }));

            ws.on('close', () => {
                logger.info('WebSocket client disconnected');
                this.orderbookManager.removeSubscriber(ws);
            });

            ws.on('error', (error) => {
                logger.error(`WebSocket error: ${error.message}`);
                this.orderbookManager.removeSubscriber(ws);
            });

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    logger.error(`Error parsing WebSocket message: ${error.message}`);
                }
            });
        });
    }

    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'ping':
                ws.send(JSON.stringify({
                    type: 'pong',
                    timestamp: Date.now()
                }));
                break;

            case 'subscribe':
                // Client can subscribe to specific symbols
                if (data.symbol) {
                    const symbol = data.symbol.toLowerCase();
                    const orderbook = this.orderbookManager.getOrderBook(symbol);
                    
                    if (orderbook) {
                        ws.send(JSON.stringify({
                            type: 'orderbook_update',
                            symbol: symbol,
                            data: orderbook.getSnapshot(),
                            timestamp: Date.now()
                        }));
                    }
                }
                break;

            default:
                logger.debug(`Unknown WebSocket message type: ${data.type}`);
        }
    }

    async start() {
        const port = process.env.PORT || 3000;
        
        try {
            // Initialize orderbooks with snapshots
            await this.binanceWebSocket.initializeOrderbooks();
            
            // Connect to Binance WebSocket
            await this.binanceWebSocket.connect();
            
            // Start HTTP server
            this.server.listen(port, () => {
                logger.info(`OrderBook247 server started on port ${port}`);
                logger.info(`WebSocket server available at ws://localhost:${port}`);
                logger.info(`REST API available at http://localhost:${port}/api`);
            });

        } catch (error) {
            logger.error(`Error starting server: ${error.message}`);
            process.exit(1);
        }
    }

    async stop() {
        logger.info('Shutting down OrderBook247 server...');
        
        this.binanceWebSocket.disconnect();
        this.wss.close();
        this.server.close();
        
        logger.info('Server stopped');
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});

// Start the server
const server = new OrderBookServer();
server.start(); 