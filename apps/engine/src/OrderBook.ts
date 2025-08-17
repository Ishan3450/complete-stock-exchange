import { Order, Fill } from "@repo/shared-types/types"

export interface OrderExecuted {
    executedQuantity: number;
    fills: Fill[];
}

export class OrderBook {
    private bids: Order[];
    private asks: Order[];
    private baseAsset: string;
    private quoteAsset: string;
    private marketName: string;
    private lastTradeId: number;

    constructor(baseAsset: string, quoteAsset: string) {
        this.baseAsset = baseAsset;
        this.quoteAsset = quoteAsset;
        this.marketName = `${baseAsset}_${quoteAsset}`;
        this.lastTradeId = 0;
        this.bids = this.asks = [];
    }

    public addOrder(order: Order): OrderExecuted {
        if (order.side == "buy") {
            const { executedQuantity, fills } = this._matchBid(order);
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
            const { executedQuantity, fills } = this._matchAsk(order);
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

    private _matchBid(order: Order): OrderExecuted {
        // If buy order comes → check lowest sell price first.
        const executedFills: Fill[] = [];
        let executedQuantity = 0;
        let remainingQuantityToFill = order.quantity - order.filled;

        // TODO: instead of sorting everytime, try using HEAP structure
        const sortedAsks: Order[] = this.asks.sort((a, b) => a.price - b.price);

        for (let i = 0; i < sortedAsks.length; i++) {
            const ask = sortedAsks[i];
            if (ask && ask.userId != order.userId && ask.price <= order.price) {
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

    private _matchAsk(order: Order): OrderExecuted {
        // If sell order comes → check highest buy price first.
        const executedFills: Fill[] = [];
        let executedQuantity = 0;
        let remainingQuantityToFill = order.quantity - order.filled;

        // TODO: instead of sorting everytime, try using HEAP structure
        const sortedBids: Order[] = this.bids.sort((a, b) => b.price - a.price);
        for (let i = 0; i < sortedBids.length; i++) {
            const bid = sortedBids[i];
            if (bid && bid.userId != order.userId && bid.price >= order.price) {
                // we are good to process this as fill
                const quantityToBeExecuted = Math.min(remainingQuantityToFill, bid.quantity - bid.filled);
                executedQuantity += quantityToBeExecuted;
                remainingQuantityToFill -= quantityToBeExecuted;
                bid.filled += quantityToBeExecuted;

                executedFills.push({
                    price: bid.price,
                    quantity: quantityToBeExecuted,
                    fillOwnerId: bid.userId,
                    tradeId: ++this.lastTradeId,
                    marketOrderId: bid.orderId
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

    public cancelOrder(orderId: number, side: "buy" | "sell"): Order | boolean {
        switch (side) {
            case "buy": {
                const index = this.bids.findIndex(bid => bid.orderId == orderId);
                if (index !== -1) {
                    return this.bids.splice(index, 1)[0] ?? false;
                }
                break;
            }
            case "sell": {
                const index = this.asks.findIndex(ask => ask.orderId == orderId);
                if (index !== -1) {
                    return this.asks.splice(index, 1)[0] ?? false;
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
    public getDepth(): { bids: Record<number, number>, asks: Record<number, number> } {
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

    public getUserOpenOrders(userId: string): { bids: Order[], asks: Order[] } {
        return {
            bids: this.bids.filter(bid => bid.userId == userId),
            asks: this.asks.filter(ask => ask.userId == userId),
        }
    }
}
