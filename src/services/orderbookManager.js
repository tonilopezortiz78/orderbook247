const OrderBook = require('../models/OrderBook');
const logger = require('../utils/logger');
const Validators = require('../utils/validators');

class OrderBookManager {
    constructor() {
        this.orderbooks = new Map(); // symbol -> OrderBook
        this.subscribers = new Set(); // WebSocket clients for broadcasting
    }

    createOrderBook(symbol) {
        const orderbook = new OrderBook(symbol);
        this.orderbooks.set(symbol, orderbook);
        logger.info(`Created orderbook for ${symbol}`);
        return orderbook;
    }

    getOrderBook(symbol) {
        return this.orderbooks.get(symbol);
    }

    getAllOrderBooks() {
        const result = {};
        for (const [symbol, orderbook] of this.orderbooks) {
            result[symbol] = orderbook.getSnapshot();
        }
        return result;
    }

    updateOrderBook(symbol, depthData) {
        let orderbook = this.getOrderBook(symbol);
        if (!orderbook) {
            logger.warn(`Orderbook not found for symbol: ${symbol}, creating new one`);
            orderbook = this.createOrderBook(symbol);
        }

        // For empty orderbooks or when there's a large sequence gap, accept the update
        if (orderbook.lastUpdateId === 0) {
            logger.info(`Accepting first update for ${symbol} with sequence ${depthData.u}`);
            orderbook.updateLastUpdateId(depthData.u);
        } else {
            // Check if there's a large sequence gap (more than 1000)
            const sequenceGap = depthData.U - orderbook.lastUpdateId;
            if (sequenceGap > 1000) {
                logger.warn(`Large sequence gap for ${symbol}: current=${orderbook.lastUpdateId}, new=${depthData.U}, gap=${sequenceGap}. Accepting update.`);
                orderbook.updateLastUpdateId(depthData.u);
            } else {
                // Validate sequence numbers for normal updates
                if (!Validators.validateSequenceNumber(
                    orderbook.lastUpdateId,
                    depthData.U,
                    depthData.u
                )) {
                    return false;
                }
            }
        }

        // Update bids
        for (const level of depthData.b) {
            if (Validators.isValidPriceLevel(level)) {
                const { price, quantity } = Validators.sanitizePriceLevel(level);
                orderbook.addBid(price, quantity);
            }
        }

        // Update asks
        for (const level of depthData.a) {
            if (Validators.isValidPriceLevel(level)) {
                const { price, quantity } = Validators.sanitizePriceLevel(level);
                orderbook.addAsk(price, quantity);
            }
        }

        // Update sequence number
        orderbook.updateLastUpdateId(depthData.u);

        // Broadcast to subscribers
        this.broadcastUpdate(symbol, orderbook.getSnapshot());

        return true;
    }

    setSnapshot(symbol, snapshotData) {
        if (!Validators.isValidSnapshot(snapshotData)) {
            logger.error(`Invalid snapshot data for ${symbol}`);
            return false;
        }

        let orderbook = this.getOrderBook(symbol);
        if (!orderbook) {
            orderbook = this.createOrderBook(symbol);
        }

        // Clear existing data
        orderbook.clear();

        // Set bids
        for (const level of snapshotData.bids) {
            if (Validators.isValidPriceLevel(level)) {
                const { price, quantity } = Validators.sanitizePriceLevel(level);
                orderbook.addBid(price, quantity);
            }
        }

        // Set asks
        for (const level of snapshotData.asks) {
            if (Validators.isValidPriceLevel(level)) {
                const { price, quantity } = Validators.sanitizePriceLevel(level);
                orderbook.addAsk(price, quantity);
            }
        }

        // Set sequence number
        orderbook.updateLastUpdateId(snapshotData.lastUpdateId);

        logger.info(`Set snapshot for ${symbol} with ${snapshotData.bids.length} bids and ${snapshotData.asks.length} asks`);
        return true;
    }

    addSubscriber(ws) {
        this.subscribers.add(ws);
        logger.info(`Added subscriber, total: ${this.subscribers.size}`);
    }

    removeSubscriber(ws) {
        this.subscribers.delete(ws);
        logger.info(`Removed subscriber, total: ${this.subscribers.size}`);
    }

    broadcastUpdate(symbol, snapshot) {
        const message = JSON.stringify({
            type: 'orderbook_update',
            symbol: symbol,
            data: snapshot,
            timestamp: Date.now()
        });

        // Remove disconnected clients
        for (const ws of this.subscribers) {
            if (ws.readyState === ws.OPEN) {
                try {
                    ws.send(message);
                } catch (error) {
                    logger.error(`Error sending to subscriber: ${error.message}`);
                    this.removeSubscriber(ws);
                }
            } else {
                this.removeSubscriber(ws);
            }
        }
    }

    getStats() {
        const stats = {
            totalOrderbooks: this.orderbooks.size,
            totalSubscribers: this.subscribers.size,
            symbols: Array.from(this.orderbooks.keys()),
            orderbooks: {}
        };

        for (const [symbol, orderbook] of this.orderbooks) {
            stats.orderbooks[symbol] = {
                lastUpdateId: orderbook.lastUpdateId,
                lastUpdateTime: orderbook.lastUpdateTime,
                bidCount: orderbook.bids.size,
                askCount: orderbook.asks.size,
                spread: orderbook.getSpread(),
                midPrice: orderbook.getMidPrice()
            };
        }

        return stats;
    }
}

module.exports = OrderBookManager; 