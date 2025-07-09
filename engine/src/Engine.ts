import { Fill, OrderBook } from "./OrderBook";
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
    market: Map<string, OrderBook>; // base_quote -> orderbook
    users: Map<string, User>; // userId -> info
    // TODO: add trade type array containing globally happened trades for audit/log purpose
    // trades: Trade[];

    constructor() {
        this.market = new Map<string, OrderBook>();
        this.users = new Map<string, User>();

        this._addDemoData();
    }

    _addDemoData() {

    }

    process({ clientId, message }: { clientId: string, message: MessageFromApiServer }): void {
        switch (message.type) {
            case "CREATE_ORDER":
                const { quantity, price, market, side, userId } = message.data;
                // const {quantityExecuted, fills, orderId} = this._createOrder(quantity, price, market, side, userId);
                break;
            case "CANCEL_ORDER":
                break;
            case "GET_DEPTH":
                break;
            default:
                break;
        }
    }

    _createOrder(quantity: number, price: number, market: string, side: "buy" | "sell", userId: string): { quantityExecuted: number, fills: Fill[], orderId: number } {
        const marketInfo = market.split("_");
        const baseAsset = marketInfo[0];
        const quoteAsset = marketInfo[1];

        this._checkSufficientFundsOrHoldings(quantity, price, baseAsset, quoteAsset, side, userId);

        // call for order book

        return {
            quantityExecuted: 0,
            fills: [],
            orderId: 0
        }
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
        } else {
            if ((user.lockedHolding.get(baseAsset) ?? 0) < quantity) {
                throw new Error("Insufficient funds to sell !!")
            }
        }
    }
}