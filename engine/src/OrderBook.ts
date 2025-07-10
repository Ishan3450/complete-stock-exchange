interface Order {
    price: number;
    quantity: number;
    side: "buy" | "sell";
    userId: string;
    orderId: number;
    filled: number;
}

export interface Fill {
    price: number;
    quantity: number;
    fillOwnerId: string;
    tradeId: number;
    marketOrderId: number;
}

export interface OrderExecuted {
    executedQuantity: number;
    fills: Fill[];
}

export class OrderBook {
    bids: Order[];
    asks: Order[];
    baseAsset: string;
    quoteAsset: string;
    marketName: string;
    lastTradeId: number;

    constructor(baseAsset: string, quoteAsset: string) {
        this.baseAsset = baseAsset;
        this.quoteAsset = quoteAsset;
        this.marketName = `${baseAsset}_${quoteAsset}`;
        this.lastTradeId = 0;
        this.bids = this.asks = [];

        this.addDemoData();
    }

    addDemoData() {
        this.bids = [
            { price: 99, quantity: 1.5, side: "buy", userId: "user1", orderId: 1, filled: 0, },
            { price: 98, quantity: 3, side: "buy", userId: "user2", orderId: 2, filled: 0, },
            { price: 97.5, quantity: 1.5, side: "buy", userId: "user3", orderId: 3, filled: 0, },
            { price: 97.5, quantity: 1.5, side: "buy", userId: "user8", orderId: 8, filled: 0, },
        ];

        this.asks = [
            { price: 100, quantity: 2, side: "sell", userId: "user4", orderId: 4, filled: 0, },
            { price: 100, quantity: 2, side: "sell", userId: "user7", orderId: 7, filled: 0, },
            { price: 101, quantity: 4, side: "sell", userId: "user5", orderId: 5, filled: 0, },
            { price: 102.5, quantity: 1, side: "sell", userId: "user6", orderId: 6, filled: 0, },
        ];
    }


    addOrder(order: Order): OrderExecuted {
        if (order.side == "buy") {
            const { executedQuantity, fills } = this.matchBid(order);
            order.filled += executedQuantity;
            if (executedQuantity == order.quantity) {
                return {
                    executedQuantity,
                    fills
                }
            }
            this.bids.push(order);
            return {
                executedQuantity,
                fills
            }
        } else {
            const { executedQuantity, fills } = this.matchAsk(order);
            order.filled += executedQuantity;
            if (executedQuantity == order.quantity) {
                return {
                    executedQuantity, fills
                }
            }
            this.asks.push(order);
            return { executedQuantity, fills }
        }
    }

    matchBid(order: Order): OrderExecuted {
        // If buy order comes → check lowest sell price first.
        const executedFills: Fill[] = [];
        let executedQuantity = 0;
        let remainingQuantityToFill = order.quantity - order.filled;

        // TODO: instead of sorting everytime, try using HEAP structure
        const sortedAsks: Order[] = this.asks.sort((a, b) => a.price - b.price);

        for (let i = 0; i < sortedAsks.length; i++) {
            const ask = sortedAsks[i];
            if (ask.price <= order.price) {
                const quantityToBeExecuted = Math.min(remainingQuantityToFill, ask.quantity - ask.filled);
                executedQuantity += quantityToBeExecuted;
                remainingQuantityToFill -= quantityToBeExecuted;
                ask.filled += quantityToBeExecuted;

                executedFills.push({
                    price: ask.price,
                    quantity: quantityToBeExecuted,
                    fillOwnerId: ask.userId,
                    tradeId: ++this.lastTradeId,
                    marketOrderId: ask.orderId,
                });

                if (remainingQuantityToFill == 0) break;
            }
        }

        this.asks = sortedAsks.filter(ask => ask.filled != ask.quantity);
        return {
            executedQuantity: executedQuantity,
            fills: executedFills
        }
    }

    matchAsk(order: Order): OrderExecuted {
        // If sell order comes → check highest buy price first.
        const executedFills: Fill[] = [];
        let executedQuantity = 0;
        let remainingQuantityToFill = order.quantity - order.filled;

        // TODO: instead of sorting everytime, try using HEAP structure
        const sortedBids: Order[] = this.bids.sort((a, b) => b.price - a.price);
        for (let i = 0; i < sortedBids.length; i++) {
            if (sortedBids[i].price >= order.price) {
                // we are good to process this as fill
                const quantityToBeExecuted = Math.min(remainingQuantityToFill, sortedBids[i].quantity - sortedBids[i].filled);
                executedQuantity += quantityToBeExecuted;
                remainingQuantityToFill -= quantityToBeExecuted;
                sortedBids[i].filled += quantityToBeExecuted;

                executedFills.push({
                    price: sortedBids[i].price,
                    quantity: quantityToBeExecuted,
                    fillOwnerId: sortedBids[i].userId,
                    tradeId: ++this.lastTradeId,
                    marketOrderId: sortedBids[i].orderId
                });

                if (remainingQuantityToFill == 0) break;
            }
        }

        this.bids = sortedBids.filter(bid => bid.quantity != bid.filled);
        return {
            executedQuantity: executedQuantity,
            fills: executedFills
        }
    }

    cancelOrder(orderId: number, side: "buy" | "sell"): Order | boolean {
        switch (side) {
            case "buy": {
                const index = this.bids.findIndex(bid => bid.orderId == orderId);
                if (index !== -1) {
                    return this.bids.splice(index, 1)[0];
                }
                break;
            }
            case "sell": {
                const index = this.asks.findIndex(ask => ask.orderId == orderId);
                if (index !== -1) {
                    return this.asks.splice(index, 1)[0];
                }
                break;
            }
        }
        return false;
    }

    /**
     * Returns the current aggregated depth of the order book.
     *
     * The depth is represented as an object containing two properties: bids and asks.
     * Each property is a record where the keys are price levels and the values are the count of orders at that price.
     *
     * Example return value:
     * {
     *   bids: { 100: 2, 99: 1 },
     *   asks: { 101: 3, 102: 1 }
     * }
     * 
     * This means there are 2 bids at price 100, 1 bid at price 99,
     * 3 asks at price 101, and 1 ask at price 102.
     */
    getDepth(): { bids: {}, asks: {} } {
        this.bids = this.bids.sort((a, b) => b.price - a.price);
        this.asks = this.asks.sort((a, b) => a.price - b.price);

        const aggregatedDepth: { bids: Record<number, number>, asks: Record<number, number> } = {
            bids: {},
            asks: {}
        };
        this.bids.forEach(bid => aggregatedDepth.bids[bid.price] = (aggregatedDepth.bids[bid.price] ?? 0) + 1)
        this.asks.forEach(ask => aggregatedDepth.asks[ask.price] = (aggregatedDepth.asks[ask.price] ?? 0) + 1)
        return aggregatedDepth;
    }

    getUserOpenOrders(userId: string): { bids: Order[], asks: Order[] } {
        return {
            bids: this.bids.filter(bid => bid.userId == userId),
            asks: this.asks.filter(ask => ask.userId == userId),
        }
    }
}

function main() {
    const orderbook: OrderBook = new OrderBook('TATA', 'INR');

    // const { executedQuantity, fills }: OrderExecuted = orderbook.addOrder({
    //     price: 101,
    //     quantity: 5,
    //     side: "buy",
    //     userId: "test",
    //     orderId: 1,
    //     filled: 0,
    // });
    // const {executedQuantity, fills}: OrderExecuted = orderbook.addOrder({
    //     price: 96,
    //     quantity: 2,
    //     side: "sell",
    //     userId: "test",
    //     orderId: 1,
    //     filled: 0,
    // });

    // console.log(executedQuantity)
    // console.log(fills)
    // console.table(orderbook.bids);
    // console.table(orderbook.asks);
    console.log(orderbook.getDepth());

}
main();