import { Fill, OrderBook, OrderExecuted } from "./OrderBook";
import { RedisManager } from "./RedisManager";
import { MessageFromApiServer } from "./types/fromApi";
// import { MessageToApiServer } from "./types/toApi";

interface User {
    userId: string;
    balance: Map<string, number>; // currency -> amount
    lockedBalance: Map<string, number>; // currency -> amount
    holdings: Map<string, number>; // base_asset -> quantity
    lockedHolding: Map<string, number>; // base_asset -> quantity
}

export class Engine {
    markets: Map<string, OrderBook>; // base_quote -> orderbook
    users: Map<string, User>; // userId -> info
    lastTradeId: number;
    // TODO: add trade type array containing globally happened trades for audit/log purpose
    // trades: Trade[];

    constructor() {
        this.markets = new Map<string, OrderBook>();
        this.users = new Map<string, User>();
        this.lastTradeId = -1;

        this._addDemoData();
    }

    _addDemoData() {

    }

    process({ clientId, message }: { clientId: string, message: MessageFromApiServer }): void {
        switch (message.type) {
            case "CREATE_ORDER":
                try {
                    const { quantity, price, market, side, userId } = message.data;
                    const { executedQuantity, fills, orderId } = this._createOrder(quantity, price, market, side, userId);
                    RedisManager.getInstance().sendToApiServer(clientId, {
                        type: "ORDER_PLACED",
                        data: { executedQuantity, fills, orderId }
                    });
                } catch (error) {
                    console.log(error);
                    RedisManager.getInstance().sendToApiServer(clientId, {
                        type: "ORDER_CANCELLED",
                        data: {
                            executedQuantity: 0,
                            fills: [],
                            orderId: 0,
                        }
                    });
                }
                break;
            case "CANCEL_ORDER":
                try {
                    const { orderId, market, userId, side } = message.data;
                    const res = this.markets.get(market)?.cancelOrder(orderId, side);

                    if(!res) {
                        throw new Error("Manualy ERR: No result from cancel order !!");
                    }
                    
                } catch (error) {
                    console.log(error);
                }

            case "GET_DEPTH":
                break;
            default:
                break;
        }
    }

    _createOrder(quantity: number, price: number, market: string, side: "buy" | "sell", userId: string): { executedQuantity: number, fills: Fill[], orderId: number } {
        const marketInfo = market.split("_");
        const baseAsset = marketInfo[0];
        const quoteAsset = marketInfo[1];

        this._checkSufficientFundsOrHoldings(quantity, price, baseAsset, quoteAsset, side, userId);

        // call for order book
        const { fills, executedQuantity }: OrderExecuted = this.markets.get(market)?.addOrder({
            quantity, price, side, userId, orderId: ++this.lastTradeId, filled: 0
        }) ?? { executedQuantity: 0, fills: [] };

        this._updateUserFundsOrHoldings(executedQuantity, fills, price, baseAsset, quoteAsset, side, userId);
        // this._updateDbOrders(); // update order and fills matched with that order
        // this._addDbTrades(); // add all the fills/trades happened during matching
        // this._updateWsTicker();

        return { fills, executedQuantity, orderId: this.lastTradeId };
    }

    _checkSufficientFundsOrHoldings(quantity: number, price: number, baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string): void {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error("User not found");
        }
        if (side == "buy") {
            const amount = quantity * price;
            if ((user.balance.get(quoteAsset) ?? 0) < amount) {
                throw new Error("Insufficient balance to buy !!");
            }
            user.balance.set(quoteAsset, (user.balance.get(quoteAsset) ?? 0) - amount);
            user.lockedBalance.set(quoteAsset, (user.lockedBalance.get(quoteAsset) ?? 0) + amount);
        } else {
            if ((user.holdings.get(baseAsset) ?? 0) < quantity) {
                throw new Error("Insufficient funds to sell !!")
            }
            user.holdings.set(baseAsset, (user.holdings.get(baseAsset) ?? 0) - quantity);
            user.lockedHolding.set(baseAsset, (user.lockedHolding.get(baseAsset) ?? 0) + quantity);
        }
    }
    _updateUserFundsOrHoldings(executedQuantity: number, fills: Fill[], price: number, baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string): void {
        /**
         * TODO:
         * - Add durability to this function, like implement all-or-nothing same as commit and rollover in MySQL
         */
        const user = this.users.get(userId);
        if (!user) {
            throw new Error("User not found");
        }
        if (side == "buy") {
            const amount = executedQuantity * price;
            fills.forEach(fill => {
                const fillOwner = this.users.get(fill.fillOwnerId);
                if (fillOwner) {
                    fillOwner.lockedHolding.set(baseAsset, (fillOwner.lockedHolding.get(baseAsset) ?? 0) - fill.quantity);
                    fillOwner.balance.set(quoteAsset, (fillOwner.balance.get(quoteAsset) ?? 0) + (fill.price * fill.quantity));
                }
                // TODO [IMP]: replace fillOwner with try catch and do something when some err occurs in any case like user not found, quoteAsset key is not there and store that fill separately in a list to handle it 
            })
            user.lockedBalance.set(quoteAsset, (user.lockedBalance.get(quoteAsset) ?? 0) - amount);
            user.holdings.set(baseAsset, user.holdings.get(baseAsset)! + executedQuantity);
        } else {
            fills.forEach(fill => {
                const fillOwner = this.users.get(fill.fillOwnerId);
                if (fillOwner) {
                    fillOwner.holdings.set(baseAsset, fillOwner.holdings.get(baseAsset)! + fill.quantity);
                    fillOwner.lockedBalance.set(quoteAsset, fillOwner.lockedBalance.get(quoteAsset)! - (fill.quantity * fill.price));
                }
            });
            user.lockedHolding.set(baseAsset, user.lockedHolding.get(baseAsset)! - executedQuantity)
        }
    }
}