class PriceLevel {
    constructor(price, quantity, count = 1) {
        this.price = parseFloat(price);
        this.quantity = parseFloat(quantity);
        this.count = parseInt(count);
        this.timestamp = Date.now();
    }

    update(quantity, count) {
        this.quantity = parseFloat(quantity);
        this.count = parseInt(count);
        this.timestamp = Date.now();
    }

    remove() {
        this.quantity = 0;
        this.count = 0;
        this.timestamp = Date.now();
    }

    toJSON() {
        return {
            price: this.price,
            quantity: this.quantity,
            count: this.count,
            timestamp: this.timestamp
        };
    }
}

module.exports = PriceLevel; 