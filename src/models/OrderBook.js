const PriceLevel = require('./PriceLevel');

class OrderBook {
    constructor(symbol) {
        this.symbol = symbol;
        this.bids = new Map(); // price -> PriceLevel
        this.asks = new Map(); // price -> PriceLevel
        this.lastUpdateId = 0;
        this.lastUpdateTime = Date.now();
    }

    addBid(price, quantity, count = 1) {
        const priceKey = price.toString();
        if (quantity > 0) {
            this.bids.set(priceKey, new PriceLevel(price, quantity, count));
        } else {
            this.bids.delete(priceKey);
        }
    }

    addAsk(price, quantity, count = 1) {
        const priceKey = price.toString();
        if (quantity > 0) {
            this.asks.set(priceKey, new PriceLevel(price, quantity, count));
        } else {
            this.asks.delete(priceKey);
        }
    }

    updateBid(price, quantity, count) {
        const priceKey = price.toString();
        const level = this.bids.get(priceKey);
        if (level) {
            if (quantity > 0) {
                level.update(quantity, count);
            } else {
                this.bids.delete(priceKey);
            }
        }
    }

    updateAsk(price, quantity, count) {
        const priceKey = price.toString();
        const level = this.asks.get(priceKey);
        if (level) {
            if (quantity > 0) {
                level.update(quantity, count);
            } else {
                this.asks.delete(priceKey);
            }
        }
    }

    getBids(limit = null) {
        const sortedBids = Array.from(this.bids.values())
            .sort((a, b) => b.price - a.price); // Sort descending for bids
        
        if (limit) {
            return sortedBids.slice(0, limit).map(level => level.toJSON());
        }
        return sortedBids.map(level => level.toJSON());
    }

    getAsks(limit = null) {
        const sortedAsks = Array.from(this.asks.values())
            .sort((a, b) => a.price - b.price); // Sort ascending for asks
        
        if (limit) {
            return sortedAsks.slice(0, limit).map(level => level.toJSON());
        }
        return sortedAsks.map(level => level.toJSON());
    }

    getSnapshot(limit = null) {
        return {
            symbol: this.symbol,
            lastUpdateId: this.lastUpdateId,
            lastUpdateTime: this.lastUpdateTime,
            bids: this.getBids(limit),
            asks: this.getAsks(limit),
            spread: this.getSpread(),
            midPrice: this.getMidPrice(),
            totalBids: this.bids.size,
            totalAsks: this.asks.size
        };
    }

    getSpread() {
        const bestBid = this.getBids(1)[0];
        const bestAsk = this.getAsks(1)[0];
        
        if (bestBid && bestAsk) {
            return bestAsk.price - bestBid.price;
        }
        return null;
    }

    getMidPrice() {
        const bestBid = this.getBids(1)[0];
        const bestAsk = this.getAsks(1)[0];
        
        if (!bestBid || !bestAsk) {
            return null;
        }
        
        return (bestBid.price + bestAsk.price) / 2;
    }

    // Calculate accumulated quantity to reach a specific price level
    getAccumulatedQuantityToPrice(targetPrice, side = 'both') {
        let accBidQty = 0;
        let accAskQty = 0;
        let accBidCost = 0;
        let accAskCost = 0;

        // Calculate accumulated bid quantity (buy orders)
        if (side === 'both' || side === 'bids') {
            const sortedBids = Array.from(this.bids.values())
                .sort((a, b) => b.price - a.price); // Highest to lowest

            for (const level of sortedBids) {
                if (level.price >= targetPrice) {
                    accBidQty += level.quantity;
                    accBidCost += level.quantity * level.price;
                } else {
                    break; // Stop when we reach prices below target
                }
            }
        }

        // Calculate accumulated ask quantity (sell orders)
        if (side === 'both' || side === 'asks') {
            const sortedAsks = Array.from(this.asks.values())
                .sort((a, b) => a.price - b.price); // Lowest to highest

            for (const level of sortedAsks) {
                if (level.price <= targetPrice) {
                    accAskQty += level.quantity;
                    accAskCost += level.quantity * level.price;
                } else {
                    break; // Stop when we reach prices above target
                }
            }
        }

        return {
            targetPrice,
            bids: {
                quantity: accBidQty,
                cost: accBidCost,
                averagePrice: accBidQty > 0 ? accBidCost / accBidQty : 0
            },
            asks: {
                quantity: accAskQty,
                cost: accAskCost,
                averagePrice: accAskQty > 0 ? accAskCost / accAskQty : 0
            },
            total: {
                quantity: accBidQty + accAskQty,
                cost: accBidCost + accAskCost,
                averagePrice: (accBidQty + accAskQty) > 0 ? (accBidCost + accAskCost) / (accBidQty + accAskQty) : 0
            }
        };
    }

    // Calculate market impact for a given order size
    getMarketImpact(orderSize, side = 'buy') {
        if (orderSize <= 0) {
            return null;
        }

        let remainingSize = orderSize;
        let totalCost = 0;
        let levelsConsumed = [];
        let finalPrice = 0;

        if (side === 'buy') {
            // Buying - consume asks (sell orders)
            const sortedAsks = Array.from(this.asks.values())
                .sort((a, b) => a.price - b.price); // Lowest to highest

            for (const level of sortedAsks) {
                if (remainingSize <= 0) break;

                const consumed = Math.min(remainingSize, level.quantity);
                totalCost += consumed * level.price;
                remainingSize -= consumed;

                levelsConsumed.push({
                    price: level.price,
                    quantity: consumed,
                    cost: consumed * level.price
                });

                finalPrice = level.price;
            }
        } else {
            // Selling - consume bids (buy orders)
            const sortedBids = Array.from(this.bids.values())
                .sort((a, b) => b.price - a.price); // Highest to lowest

            for (const level of sortedBids) {
                if (remainingSize <= 0) break;

                const consumed = Math.min(remainingSize, level.quantity);
                totalCost += consumed * level.price;
                remainingSize -= consumed;

                levelsConsumed.push({
                    price: level.price,
                    quantity: consumed,
                    cost: consumed * level.price
                });

                finalPrice = level.price;
            }
        }

        const averagePrice = totalCost / (orderSize - remainingSize);
        const slippage = side === 'buy' ? 
            (averagePrice - this.getAsks(1)[0]?.price) / this.getAsks(1)[0]?.price * 100 :
            (this.getBids(1)[0]?.price - averagePrice) / this.getBids(1)[0]?.price * 100;

        return {
            orderSize,
            side,
            totalCost,
            averagePrice,
            finalPrice,
            remainingSize,
            filledSize: orderSize - remainingSize,
            levelsConsumed,
            slippage: slippage || 0,
            canFill: remainingSize === 0
        };
    }

    // Get liquidity profile at different price levels
    getLiquidityProfile(levels = 10) {
        const bids = this.getBids(levels);
        const asks = this.getAsks(levels);
        
        const profile = {
            bids: [],
            asks: [],
            timestamp: Date.now()
        };

        // Calculate accumulated quantities for bids
        let accBidQty = 0;
        let accBidCost = 0;
        for (const level of bids) {
            accBidQty += level.quantity;
            accBidCost += level.quantity * level.price;
            profile.bids.push({
                ...level,
                accumulatedQuantity: accBidQty,
                accumulatedCost: accBidCost,
                averagePrice: accBidQty > 0 ? accBidCost / accBidQty : 0
            });
        }

        // Calculate accumulated quantities for asks
        let accAskQty = 0;
        let accAskCost = 0;
        for (const level of asks) {
            accAskQty += level.quantity;
            accAskCost += level.quantity * level.price;
            profile.asks.push({
                ...level,
                accumulatedQuantity: accAskQty,
                accumulatedCost: accAskCost,
                averagePrice: accAskQty > 0 ? accAskCost / accAskQty : 0
            });
        }

        return profile;
    }

    updateLastUpdateId(updateId) {
        this.lastUpdateId = updateId;
        this.lastUpdateTime = Date.now();
    }

    clear() {
        this.bids.clear();
        this.asks.clear();
        this.lastUpdateId = 0;
        this.lastUpdateTime = Date.now();
    }
}

module.exports = OrderBook; 