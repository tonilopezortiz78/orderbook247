const OrderBook = require('../../src/models/OrderBook');

describe('OrderBook', () => {
    let orderbook;

    beforeEach(() => {
        orderbook = new OrderBook('btcusdt');
    });

    test('should create orderbook with correct symbol', () => {
        expect(orderbook.symbol).toBe('btcusdt');
        expect(orderbook.bids.size).toBe(0);
        expect(orderbook.asks.size).toBe(0);
    });

    test('should add bid correctly', () => {
        orderbook.addBid(50000, 1.5);
        const bids = orderbook.getBids();
        
        expect(bids).toHaveLength(1);
        expect(bids[0].price).toBe(50000);
        expect(bids[0].quantity).toBe(1.5);
    });

    test('should add ask correctly', () => {
        orderbook.addAsk(50001, 2.0);
        const asks = orderbook.getAsks();
        
        expect(asks).toHaveLength(1);
        expect(asks[0].price).toBe(50001);
        expect(asks[0].quantity).toBe(2.0);
    });

    test('should remove bid when quantity is 0', () => {
        orderbook.addBid(50000, 1.5);
        orderbook.addBid(50000, 0);
        
        const bids = orderbook.getBids();
        expect(bids).toHaveLength(0);
    });

    test('should remove ask when quantity is 0', () => {
        orderbook.addAsk(50001, 2.0);
        orderbook.addAsk(50001, 0);
        
        const asks = orderbook.getAsks();
        expect(asks).toHaveLength(0);
    });

    test('should calculate spread correctly', () => {
        orderbook.addBid(50000, 1.5);
        orderbook.addAsk(50001, 2.0);
        
        const spread = orderbook.getSpread();
        expect(spread).toBe(1);
    });

    test('should calculate mid price correctly', () => {
        orderbook.addBid(50000, 1.5);
        orderbook.addAsk(50001, 2.0);
        
        const midPrice = orderbook.getMidPrice();
        expect(midPrice).toBe(50000.5);
    });

    test('should get snapshot with correct structure', () => {
        orderbook.addBid(50000, 1.5);
        orderbook.addAsk(50001, 2.0);
        
        const snapshot = orderbook.getSnapshot();
        
        expect(snapshot).toHaveProperty('symbol', 'btcusdt');
        expect(snapshot).toHaveProperty('bids');
        expect(snapshot).toHaveProperty('asks');
        expect(snapshot).toHaveProperty('spread');
        expect(snapshot).toHaveProperty('midPrice');
        expect(snapshot.bids).toHaveLength(1);
        expect(snapshot.asks).toHaveLength(1);
    });

    test('should sort bids in descending order', () => {
        orderbook.addBid(50000, 1.5);
        orderbook.addBid(50001, 2.0);
        orderbook.addBid(49999, 1.0);
        
        const bids = orderbook.getBids();
        expect(bids[0].price).toBe(50001);
        expect(bids[1].price).toBe(50000);
        expect(bids[2].price).toBe(49999);
    });

    test('should sort asks in ascending order', () => {
        orderbook.addAsk(50001, 2.0);
        orderbook.addAsk(50000, 1.5);
        orderbook.addAsk(50002, 1.0);
        
        const asks = orderbook.getAsks();
        expect(asks[0].price).toBe(50000);
        expect(asks[1].price).toBe(50001);
        expect(asks[2].price).toBe(50002);
    });
}); 