import { OrderBook, OrderExecuted } from "./OrderBook";
import { RedisManager } from "./RedisManager";
import { Fill, Order, EngineApiMessageType, UserInterface } from "@repo/shared-types/types";


export class Engine {
    private static instance: Engine;
    private markets: Map<string, OrderBook>; // base_quote -> orderbook
    private users: Map<string, UserInterface>; // userId -> info
    private lastTradeId: number;
    // TODO: add trade type array containing globally happened trades for audit/log purpose
    // trades: Map<Market, Trade>;

    /**
     * TODO: add snapshot mechanism
     */

    private constructor() {
        this.markets = new Map<string, OrderBook>();
        this.users = new Map<string, UserInterface>();
        this.lastTradeId = -1;
        this._addDemoData();
    }

    private _addDemoData() {
        this.markets.set("TATA_INR", new OrderBook("TATA", "INR"));
        this.markets.set("SOL_USDC", new OrderBook("SOL", "USDC"));
        this.markets.set("BTC_USDC", new OrderBook("BTC", "USDC"));
        this.markets.set("LIC_INR", new OrderBook("LIC", "INR"));
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new Engine();
        }
        return this.instance;
    }

    public async process({ clientId, message }: { clientId: string, message: EngineApiMessageType }) {
        try {
            switch (message.type) {
                case "ENGINE_CREATE_ORDER":
                    try {
                        const { quantity, price, market, side, userId } = message.data;
                        if (!this.markets.has(market)) {
                            throw new Error(`Market ${market} does not exist`);
                        }
                        if (!this.users.has(userId)) {
                            throw new Error(`User ${userId} does not exist`);
                        }
                        if (quantity <= 0 || price <= 0) {
                            throw new Error("Quantity and price must be greater than 0");
                        }
                        if (side !== "buy" && side !== "sell") {
                            throw new Error("Side must be either 'buy' or 'sell'");
                        }
                        const { executedQuantity, fills, orderId } = this._createOrder(quantity, price, market, side, userId);
                        await RedisManager.getInstance().publishMessage(clientId, {
                            type: "API_ORDER_PLACED",
                            data: { executedQuantity, fills, orderId }
                        });
                    } catch (error: any) {
                        console.log(error);
                        await RedisManager.getInstance().publishMessage(clientId, {
                            type: "Error",
                            errorMsg: error.message,
                        });
                    }
                    break;
                case "ENGINE_CANCEL_ORDER":
                    try {
                        const { orderId, market, userId, side } = message.data;

                        if (!this.markets.has(market)) {
                            throw new Error(`Market ${market} does not exist`);
                        }
                        let order = this.markets.get(market)?.cancelOrder(orderId, side);

                        if (order === false) {
                            throw new Error("No order found to cancel !!");
                        }
                        order = order as Order;
                        const user = this.users.get(userId);
                        const [baseAsset, quoteAsset] = market.split("_");

                        if (!baseAsset || !quoteAsset) {
                            throw new Error(`Invalid market ${market}`)
                        }

                        if (side === "buy") {
                            const amount = order.price * (order.quantity - order.filled);
                            const prevLockedBalance = user?.lockedBalance[quoteAsset] ?? 0;
                            const prevBalance = user?.balance[quoteAsset] ?? 0;
                            if (user) {
                                user.lockedBalance[quoteAsset] = prevLockedBalance - amount;
                                user.balance[quoteAsset] = prevBalance + amount;

                                if (user.lockedBalance[quoteAsset] === 0) {
                                    delete user.lockedBalance[quoteAsset];
                                }
                            }
                        } else {
                            const prevLockedHolding = user?.lockedHolding[baseAsset] ?? 0;
                            const prevHolding = user?.holdings[baseAsset] ?? 0;
                            if (user) {
                                user.lockedHolding[baseAsset] = prevLockedHolding - order.quantity;
                                user.holdings[baseAsset] = prevHolding + order.quantity;

                                if (user.lockedHolding[baseAsset] === 0) {
                                    delete user.lockedHolding[baseAsset];
                                }
                            }
                        }

                        // NOTE: cancel order will be followed by get user portfolio
                        this.process({
                            clientId, message: {
                                type: "ENGINE_GET_USER_PORTFOLIO",
                                data: { userId }
                            }
                        })
                        this._wsUpdateDepthAndSend(market);
                    } catch (error: any) {
                        console.log(error);
                        await RedisManager.getInstance().publishMessage(clientId, {
                            type: "Error",
                            errorMsg: error.message,
                        })
                    }
                    break;
                case "ENGINE_GET_DEPTH":
                    try {
                        const market = this.markets.get(message.data.market);
                        if (!market) throw new Error(`No orderbook found named ${market} !!`);
                        const depth = market.getDepth();

                        await RedisManager.getInstance().publishMessage(clientId, {
                            type: "API_DEPTH",
                            data: depth
                        })
                    } catch (error) {
                        console.log(error);
                        await RedisManager.getInstance().publishMessage(clientId, {
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
                            balance: { INR: 1000, USD: 5.5 },
                            lockedBalance: {},
                            holdings: { TATA: 50, ETH: 2 },
                            lockedHolding: {},
                        });

                        await RedisManager.getInstance().publishMessage(clientId, {
                            type: "API_USER_CREATED",
                            data: {
                                status: true
                            }
                        })
                    } catch (error) {
                        console.log(error);
                        await RedisManager.getInstance().publishMessage(clientId, {
                            type: "API_USER_CREATED",
                            data: {
                                status: false
                            }
                        })
                    }
                    break;
                case "ENGINE_ADD_BALANCE":
                    try {
                        const { userId, currency, amount } = message.data;
                        const user = this.users.get(userId);
                        if (!user) {
                            await RedisManager.getInstance().publishMessage(clientId, {
                                type: "Error",
                                errorMsg: "No user found !!"
                            })
                            return;
                        }
                        user.balance[currency] = (user.balance[currency] ?? 0) + amount;
                    } catch (error) {
                        console.log(error);
                        await RedisManager.getInstance().publishMessage(clientId, {
                            type: "Error",
                            errorMsg: "Something went wrong"
                        })
                    }
                    break;
                case "ENGINE_GET_USER_PORTFOLIO":
                    try {
                        const { userId } = message.data;
                        const user = this.users.get(userId);
                        if (!user) {
                            await RedisManager.getInstance().publishMessage(clientId, {
                                type: "Error",
                                errorMsg: "No user found !!"
                            })
                            return;
                        }
                        await RedisManager.getInstance().publishMessage(clientId, {
                            type: "API_USER_PORTFOLIO",
                            data: {
                                user
                            }
                        })
                    } catch (error) {
                        console.log(error);
                        await RedisManager.getInstance().publishMessage(clientId, {
                            type: "Error",
                            errorMsg: "Something went wrong"
                        })
                    }
                    break;
                case "ENGINE_GET_MARKETS_LIST":
                    await RedisManager.getInstance().publishMessage(clientId, {
                        type: "API_TAKE_MARKETS_LIST",
                        data: {
                            markets: [...this.markets.keys()]
                        }
                    })
                default:
                    break;
            }
        } catch (error) {
            console.log("Process error:", error);
            await RedisManager.getInstance().publishMessage(clientId, {
                type: "Error",
                errorMsg: "Internal engine error"
            });
        }
    }

    private _createOrder(quantity: number, price: number, market: string, side: "buy" | "sell", userId: string): { executedQuantity: number, fills: Fill[], orderId: number } {
        const [baseAsset, quoteAsset] = market.split("_");

        if (!baseAsset || !quoteAsset) {
            throw new Error(`Invalid market ${market}`)
        }

        this._checkSufficientFundsOrHoldings(quantity, price, baseAsset, quoteAsset, side, userId);

        // call for order book
        const newOrder: Order = { quantity, price, side, userId, orderId: ++this.lastTradeId, filled: 0 };
        const { fills, executedQuantity }: OrderExecuted = this.markets.get(market)?.addOrder(newOrder) ?? { executedQuantity: 0, fills: [] };

        this._updateUserFundsOrHoldings(executedQuantity, fills, price, baseAsset, quoteAsset, side, userId);
        this._updateDbOrders(newOrder, fills); // update order and fills matched with that order
        this._addDbTrades(fills, market); // add all the fills/trades happened during matching
        this._wsUpdateDepthAndSend(market);
        // this._updateWsTicker();

        return { fills, executedQuantity, orderId: this.lastTradeId };
    }

    private _checkSufficientFundsOrHoldings(quantity: number, price: number, baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string): void {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error("User not found");
        }
        if (side == "buy") {
            const amount = quantity * price;
            if ((user.balance[quoteAsset] ?? 0) < amount) {
                throw new Error("Insufficient balance to buy !!");
            }
            user.balance[quoteAsset] = (user.balance[quoteAsset] ?? 0) - amount;
            user.lockedBalance[quoteAsset] = (user.lockedBalance[quoteAsset] ?? 0) + amount;

        } else {
            if ((user.holdings[baseAsset] ?? 0) < quantity) {
                throw new Error("Insufficient funds to sell !!");
            }
            user.holdings[baseAsset] = (user.holdings[baseAsset] ?? 0) - quantity;
            user.lockedHolding[baseAsset] = (user.lockedHolding[baseAsset] ?? 0) + quantity;
        }
    }
    private _updateUserFundsOrHoldings(executedQuantity: number, fills: Fill[], price: number, baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string): void {
        /**
         * TODO:
         * - Add durability to this function, like implement all-or-nothing same as commit and rollover in MySQL
         */
        const user = this.users.get(userId);
        if (!user) {
            throw new Error("User not found");
        }
        if (side == "buy") {
            fills.forEach(fill => {
                const fillOwner = this.users.get(fill.fillOwnerId);
                if (fillOwner) {
                    const prevLockedHolding = fillOwner.lockedHolding[baseAsset] ?? 0;
                    const prevBalance = fillOwner.balance[quoteAsset] ?? 0;

                    fillOwner.lockedHolding[baseAsset] = prevLockedHolding - fill.quantity;
                    fillOwner.balance[quoteAsset] = prevBalance + (fill.price * fill.quantity);

                    if (fillOwner.lockedHolding[baseAsset] === 0) {
                        delete fillOwner.lockedHolding[baseAsset];
                    }
                }
                // TODO [IMP]: replace fillOwner with try catch and handle errors, such as user not found, missing asset keys, etc. Store failed fills separately.
            });
            if (user) {
                user.lockedBalance[quoteAsset] = (user.lockedBalance[quoteAsset] ?? 0) - fills.reduce((acc, fill) => acc + (fill.price * fill.quantity), 0);
                user.holdings[baseAsset] = (user.holdings[baseAsset] ?? 0) + executedQuantity;

                if (user.lockedBalance[quoteAsset] === 0) {
                    delete user.lockedBalance[quoteAsset];
                }
            }
        } else {
            fills.forEach(fill => {
                const fillOwner = this.users.get(fill.fillOwnerId);
                if (fillOwner) {
                    const prevHoldings = fillOwner.holdings[baseAsset] ?? 0;
                    const prevLockedBalance = fillOwner.lockedBalance[quoteAsset] ?? 0;

                    fillOwner.holdings[baseAsset] = prevHoldings + fill.quantity;
                    fillOwner.lockedBalance[quoteAsset] = prevLockedBalance - (fill.quantity * fill.price);

                    if (fillOwner.lockedBalance[quoteAsset] === 0) {
                        delete fillOwner.lockedBalance[quoteAsset];
                    }
                }
            });
            if (user) {
                user.lockedHolding[baseAsset] = (user.lockedHolding[baseAsset] ?? 0) - executedQuantity;
                user.balance[quoteAsset] = (user.balance[quoteAsset] ?? 0) + fills.reduce((sum, fill) => sum + fill.price * fill.quantity, 0);

                if (user.lockedHolding[baseAsset] === 0) {
                    delete user.lockedHolding[baseAsset];
                }
            }
        }
    }

    private _updateDbOrders(newOrder: Order, fills: Fill[]): void {
        // TODO: to check here is the newOrder.filled is correctly updated or not (TO check pass by ref worked as expected or not)
        RedisManager.getInstance().pushMessageToQueue(
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
        RedisManager.getInstance().pushMessageToQueue(
            "db_processor",
            {
                type: "DB_ORDER_UPDATE_FILL",
                data: { fills }
            }
        )
    }
    private _addDbTrades(fills: Fill[], marketName: string): void {
        RedisManager.getInstance().pushMessageToQueue(
            "db_processor",
            {
                type: "DB_ADD_TRADES",
                data: {
                    trades: fills.map(fill => ({ timestamp: new Date().toISOString(), price: fill.price, quantity: fill.quantity })),
                    marketName,
                }
            }
        )
    }
    private async _wsUpdateDepthAndSend(market: string) {
        const orderBook = this.markets.get(market);
        if (!orderBook) return;

        const depth = orderBook.getDepth();
        await RedisManager.getInstance().publishMessage(`ws_depth@${market}`, {
            type: "DEPTH",
            data: {
                market,
                asks: depth.asks,
                bids: depth.bids,
            }
        });
    }

    public addMarket(baseAsset: string, quoteAsset: string): void {
        const marketName = `${baseAsset}_${quoteAsset}`;
        if (this.markets.has(marketName)) {
            throw new Error(`Market ${marketName} already exists`);
        }
        this.markets.set(marketName, new OrderBook(baseAsset, quoteAsset));
    }

    public removeMarket(marketName: string): void {
        if (!this.markets.has(marketName)) {
            throw new Error(`Market ${marketName} doesn't exists`);
        }
        this.markets.delete(marketName);
    }
}
