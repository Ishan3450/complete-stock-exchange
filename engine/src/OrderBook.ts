interface Order {
    price: number;
    quantity: number;
    side: "buy" | "sell";
    userId: string;
    orderId: number;
    filled: number;
}

interface Fill {
    price: number;
    quantity: number;
    fillOwnerId: string;
    tradeId: number;
    marketOrderId: number;
}

interface OrderExecuted {
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

    constructor(baseAsset: string, quoteAsset: string, bids: Order[], asks: Order[]) {
        this.bids = bids;
        this.asks = asks;
        this.baseAsset = baseAsset;
        this.quoteAsset = quoteAsset;
        this.marketName = `${baseAsset}_${quoteAsset}`;
        this.lastTradeId = 0;
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
            if (remainingQuantityToFill <= (sortedAsks[i].quantity - sortedAsks[i].filled) && sortedAsks[i].price <= order.price) {
                // we are good to process this as fill
                const quantityToBeExecuted = Math.min(remainingQuantityToFill, sortedAsks[i].quantity);
                executedQuantity += quantityToBeExecuted;
                remainingQuantityToFill -= quantityToBeExecuted;
                sortedAsks[i].filled += quantityToBeExecuted;

                executedFills.push({
                    price: sortedAsks[i].price,
                    quantity: quantityToBeExecuted,
                    fillOwnerId: sortedAsks[i].userId,
                    tradeId: ++this.lastTradeId,
                    marketOrderId: sortedAsks[i].orderId
                });

                if (remainingQuantityToFill == 0) break;
            }
        }

        this.asks = sortedAsks.filter(ask => ask.quantity == ask.filled);
        return {
            executedQuantity: executedQuantity,
            fills: executedFills
        }
    }

    matchAsk(order: Order): OrderExecuted {
        // If sell order comes → check highest buy price first.
        return { executedQuantity: 0, fills: [] }
    }
}
