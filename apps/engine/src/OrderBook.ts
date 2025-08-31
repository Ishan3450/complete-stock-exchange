import { Order, Fill } from "@repo/shared-types/types"
import { dbClient } from "./dbClient";

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

    public async addOrder(order: Order): Promise<OrderExecuted> {
        if (order.side == "buy") {
            const { executedQuantity, fills } = this._matchBid(order);
            order.filled += executedQuantity;

            await this._insertOrUpdateOrdersInDb(order, fills);
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

            await this._insertOrUpdateOrdersInDb(order, fills);
            if (executedQuantity == order.quantity) {
                return {
                    executedQuantity, fills
                }
            }
            this.asks.push(order);
            return { executedQuantity, fills }
        }
    }

    private async _insertOrUpdateOrdersInDb(order: Order, fills: Fill[]) {
        const tableName = `${this.marketName}_orders`;
        await dbClient.query(`
            CREATE TABLE IF NOT EXISTS ${tableName} (
                orderId     INT             NOT NULL        PRIMARY KEY,
                price       NUMERIC(10,2)   NOT NULL,
                quantity    NUMERIC(10,2)   NOT NULL,
                side        VARCHAR         NOT NULL,
                userId      INT             NOT NULL,
                filled      NUMERIC(10,2)   NOT NULL
            );
        `);

        const { rowCount } = await dbClient.query(`
            SELECT orderId FROM ${tableName} WHERE orderId = $1`,
            [order.orderId]
        );
        if (rowCount && rowCount > 1) {
            await dbClient.query(`
                UPDATE ${tableName}
                SET
                    quantity = $1,
                    filled = $2
                WHERE
                    orderId = $3
            `, [order.quantity, order.filled, order.orderId]);
        } else {
            await dbClient.query(`
                INSERT INTO ${tableName} (orderId, price, quantity, side, userId, filled)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [order.orderId, order.price, order.quantity, order.side, order.userId, order.filled]);
        }

        for (const fill of fills) {
            await dbClient.query(`
                UPDATE ${tableName}
                SET
                    filled = $1
                WHERE
                    orderId = $2
            `, [fill.quantity, fill.marketOrderId]);
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

    // TODO: improve the return structure of this method see ui code to see the complexity for this simple thing
    /**
     * Returns the current aggregated depth of the order book.
     *
     * The depth is represented as an object containing two properties: bids and asks.
     * Each property is a record where the keys are price levels and the values are the count of order quantities at that price.
     *
     * Example return value:
     * {
     *   bids: { 100: [2, 3], 99: [1, 1] }, (In Descending)
     *   asks: { 101: [3, 3], 102: [1, 4] }, (In Ascending)
     * }
     * 
     * This means there are 2 bids quantity at price 100 and 3 total <= 100, 1 bids quantity at price 99,
     * 3 asks quantity at price 101, and 1 ask quantity at price 102 and 4 total having quantity with price <= 102.
     */
    public getDepth() {
        this.bids = this.bids.sort((a, b) => b.price - a.price);
        this.asks = this.asks.sort((a, b) => a.price - b.price);

        const aggregatedDepth: { bids: Record<number, number[]>, asks: Record<number, number[]> } = {
            bids: {},
            asks: {}
        };
        let totalBidsQuantity: number = this.bids.reduce((acc, bid) => acc + (bid.quantity - bid.filled), 0);
        let totalAsksQuantity: number = 0;

        this.bids.forEach((bid) => {
            const remainingQuantityToFill = bid.quantity - bid.filled;

            if (!aggregatedDepth.bids[bid.price]) {
                aggregatedDepth.bids[bid.price] = [0, 0];
            }
            aggregatedDepth.bids[bid.price] = [
                (aggregatedDepth.bids[bid.price]![0] ?? 0) + remainingQuantityToFill,
                totalBidsQuantity,
            ];
            totalBidsQuantity -= remainingQuantityToFill;
        });
        this.asks.forEach((ask) => {
            const remainingQuantityToFill = ask.quantity - ask.filled;
            totalAsksQuantity += remainingQuantityToFill;

            if (!aggregatedDepth.asks[ask.price]) {
                aggregatedDepth.asks[ask.price] = [0, 0];
            }
            aggregatedDepth.asks[ask.price] = [
                (aggregatedDepth.asks[ask.price]![0] ?? 0) + remainingQuantityToFill,
                totalAsksQuantity,
            ];
        });

        // const test = {
        //     bids: Object.keys(aggregatedDepth.bids).map(Number).sort().map((price, idx) => (
        //         { price, quantity: aggregatedDepth.bids[price]![0], total: aggregatedDepth.bids[price]![1] }
        //     )),
        //     asks: Object.keys(aggregatedDepth.asks).map(Number).sort().map((price, idx) => (
        //         { price, quantity: aggregatedDepth.asks[price]![0], total: aggregatedDepth.asks[price]![1] }
        //     ))
        // }
        // console.log(test);

        return aggregatedDepth;
    }

    public getUserOpenOrders(userId: string): { bids: Order[], asks: Order[] } {
        return {
            bids: this.bids.filter(bid => bid.userId == userId),
            asks: this.asks.filter(ask => ask.userId == userId),
        }
    }

    public getOpenOrdersCount(): { totalBids: number, totalAsks: number } {
        return {
            totalBids: this.bids.length,
            totalAsks: this.asks.length,
        }
    }
}
