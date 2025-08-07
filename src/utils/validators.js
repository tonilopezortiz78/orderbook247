const logger = require('./logger');

class Validators {
    static isValidPriceLevel(level) {
        return (
            level &&
            typeof level[0] === 'string' && // price
            typeof level[1] === 'string' && // quantity
            !isNaN(parseFloat(level[0])) &&
            !isNaN(parseFloat(level[1])) &&
            parseFloat(level[0]) > 0 &&
            parseFloat(level[1]) >= 0
        );
    }

    static isValidDepthUpdate(data) {
        return (
            data &&
            data.e === 'depthUpdate' &&
            data.s && // symbol
            data.u && // final update ID
            data.U && // first update ID
            Array.isArray(data.b) && // bids
            Array.isArray(data.a) && // asks
            data.b.every(level => this.isValidPriceLevel(level)) &&
            data.a.every(level => this.isValidPriceLevel(level))
        );
    }

    static isValidSnapshot(data) {
        return (
            data &&
            data.lastUpdateId &&
            Array.isArray(data.bids) &&
            Array.isArray(data.asks) &&
            data.bids.every(level => this.isValidPriceLevel(level)) &&
            data.asks.every(level => this.isValidPriceLevel(level))
        );
    }

    static validateSequenceNumber(currentId, newFirstId, newLastId) {
        // Check if the new update is in sequence
        if (newFirstId <= currentId + 1 && newLastId >= currentId + 1) {
            return true;
        }
        
        logger.warn(`Sequence number mismatch: current=${currentId}, newFirst=${newFirstId}, newLast=${newLastId}`);
        return false;
    }

    static sanitizePriceLevel(level) {
        return {
            price: parseFloat(level[0]),
            quantity: parseFloat(level[1])
        };
    }
}

module.exports = Validators; 