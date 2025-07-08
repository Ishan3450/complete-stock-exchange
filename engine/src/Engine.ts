import { OrderBook } from "./OrderBook";

export class Engine {
    market: OrderBook[];

    // TODO: manage user balances using db

    constructor() {
        this.market = [];
    }
}