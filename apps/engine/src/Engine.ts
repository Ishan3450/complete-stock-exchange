import { OrderBook, OrderExecuted } from "./OrderBook";
import { RedisManager } from "./RedisManager";
import { Fill, Order, EngineApiMessageType } from "@repo/shared-types/src";

interface User {
    userId: string;
    userName: string;
    userPassword: string;
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

    /**
     * TODO: add snapshot mechanism
     */

    constructor() {
        this.markets = new Map<string, OrderBook>();
        this.users = new Map<string, User>();
        this.lastTradeId = -1;

        this._addDemoData();
    }

    _addDemoData() {
        const demoMarket = "TATA_INR";
        this.markets.set(demoMarket, new OrderBook("TATA", "INR"));

        const userA: User = {
            userId: "user1",
            userName: "Alice",
            userPassword: "password1",
            balance: new Map([["INR", 10000]]),
            lockedBalance: new Map([["INR", 0]]),
            holdings: new Map([["TATA", 2]]),
            lockedHolding: new Map([["TATA", 0]])
        };

        const userB: User = {
            userId: "user7",
            userName: "Bob",
            userPassword: "password2",
            balance: new Map([["INR", 5000]]),
            lockedBalance: new Map([["INR", 0]]),
            holdings: new Map([["TATA", 1]]),
            lockedHolding: new Map([["TATA", 0]])
        };

        this.users.set(userA.userId, userA);
        this.users.set(userB.userId, userB);
    }

    process({ clientId, message }: { clientId: string, message: EngineApiMessageType }): void {
        switch (message.type) {
            case "ENGINE_CREATE_ORDER":
                try {
                    const { quantity, price, market, side, userId } = message.data;
                    const { executedQuantity, fills, orderId } = this._createOrder(quantity, price, market, side, userId);
                    RedisManager.getInstance().publishMessageToQueue(clientId, {
                        type: "API_ORDER_PLACED",
                        data: { executedQuantity, fills, orderId }
                    });
                } catch (error) {
                    console.error(error);
                    RedisManager.getInstance().publishMessageToQueue(clientId, {
                        type: "API_ORDER_CANCELLED",
                        data: {
                            executedQuantity: 0,
                            fills: [],
                            orderId: 0,
                        }
                    });
                }
                break;
            case "ENGINE_CANCEL_ORDER":
                try {
                    const { orderId, market, userId, side } = message.data;
                    let order = this.markets.get(market)?.cancelOrder(orderId, side);

                    if (order === false) {
                        throw new Error("Manual ERR: No result from cancel order !!");
                    }
                    order = order as Order;
                    const user = this.users.get(userId);
                    const [baseAsset, quoteAsset] = market.split("_");

                    if (!baseAsset || !quoteAsset) {
                        throw new Error(`Invalid market ${market}`)
                    }

                    if (side === "buy") {
                        const amount = order.price * (order.quantity - order.filled);
                        user?.lockedBalance.set(quoteAsset, user.lockedBalance.get(quoteAsset)! - amount);
                        user?.balance.set(quoteAsset, user.balance.get(quoteAsset)! + amount);
                    } else {
                        user?.lockedHolding.set(baseAsset, user.lockedHolding.get(baseAsset)! - order.quantity);
                        user?.holdings.set(baseAsset, user.holdings.get(baseAsset)! + order.quantity);
                    }
                    this._wsUpdateDepthAndSend(market);
                } catch (error) {
                    console.error(error);
                }
                break;
            case "ENGINE_GET_DEPTH":
                try {
                    const market = this.markets.get(message.data.market);
                    if (!market) throw new Error(`No orderbook found named ${market} !!`);
                    const depth = market.getDepth();

                    RedisManager.getInstance().publishMessageToQueue(clientId, {
                        type: "API_DEPTH",
                        data: depth
                    })
                } catch (error) {
                    console.error(error);
                    RedisManager.getInstance().publishMessageToQueue(clientId, {
                        type: "API_DEPTH",
                        data: { bids: {}, asks: {} }
                    })
                }
                break;
            case "ENGINE_CREATE_USER":
                try {
                    const { userId, userName, userPassword } = message.data;

                    this.users.set(userId, {
                        userId,
                        userName,
                        userPassword,
                        balance: new Map(),
                        lockedBalance: new Map(),
                        holdings: new Map(),
                        lockedHolding: new Map(),
                    });

                    RedisManager.getInstance().publishMessageToQueue(clientId, {
                        type: "API_USER_CREATED",
                        data: {
                            status: true
                        }
                    })
                } catch (error) {
                    console.error(error);
                    RedisManager.getInstance().publishMessageToQueue(clientId, {
                        type: "API_USER_CREATED",
                        data: {
                            status: false
                        }
                    })
                }
                break;
            default:
                break;
        }
    }

    _createOrder(quantity: number, price: number, market: string, side: "buy" | "sell", userId: string): { executedQuantity: number, fills: Fill[], orderId: number } {
        const [baseAsset, quoteAsset] = market.split("_");

        if(!baseAsset || !quoteAsset) {
            throw new Error(`Invalid market ${market}`)
        }

        this._checkSufficientFundsOrHoldings(quantity, price, baseAsset, quoteAsset, side, userId);

        // call for order book
        const newOrder: Order = { quantity, price, side, userId, orderId: ++this.lastTradeId, filled: 0 };
        const { fills, executedQuantity }: OrderExecuted = this.markets.get(market)?.addOrder(newOrder) ?? { executedQuantity: 0, fills: [] };

        this._updateUserFundsOrHoldings(executedQuantity, fills, price, baseAsset, quoteAsset, side, userId);
        this._updateDbOrders(newOrder, fills); // update order and fills matched with that order
        this._addDbTrades(fills); // add all the fills/trades happened during matching
        this._wsUpdateDepthAndSend(market);
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

    _updateDbOrders(newOrder: Order, fills: Fill[]): void {
        // TODO: to check here is the newOrder.filled is correctly updated or not (TO check pass by ref worked as expected or not)
        RedisManager.getInstance().publishMessageToQueue(
            "db_processor",
            {
                type: "DB_ORDER_UPDATE",
                data: {
                    order: newOrder
                }
            }
        )

        // TODO: check below call can be merged with the above order update call or not
        // what I means is to check for the need for the case when we just want to update fill/fills in any case
        // or fill/fills will be updated with order only if that then no separate call needed
        RedisManager.getInstance().publishMessageToQueue(
            "db_processor",
            {
                type: "DB_ORDER_UPDATE_FILL",
                data: { fills }
            }
        )
    }
    _addDbTrades(fills: Fill[]): void {
        RedisManager.getInstance().publishMessageToQueue(
            "db_processor",
            {
                type: "DB_ADD_TRADES",
                data: { trades: fills }
            }
        )
    }
    _wsUpdateDepthAndSend(market: string): void {
        const orderBook = this.markets.get(market);
        if (!orderBook) return;

        const depth = orderBook.getDepth();
        RedisManager.getInstance().publishMessageToQueue(`ws_depth@${market}`, {
            stream: `depth@${market}`,
            data: {
                type: "depth",
                asks: depth.asks,
                bids: depth.bids
            }
        });
    }
}
