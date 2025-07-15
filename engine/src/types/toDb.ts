// Same file as db/src/types/fromEngine.ts

import { Fill, Order } from "../OrderBook";

export type MessageToDatabaseServer = {
    type: "DB_ORDER_UPDATE",
    data: {
        order: Order
    }
} | {
    type: "DB_ORDER_UPDATE_FILL",
    data: {
        fills: Fill[]
    }
} | {
    type: "DB_ADD_TRADES",
    data: {
        trades: Fill[]
    }
};