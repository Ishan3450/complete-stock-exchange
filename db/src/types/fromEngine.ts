// Same as: 
// Order, Fill from engine/src/types/Engine.ts
// engine/src/types/toDb.ts

export interface Order {
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

export type DBMessageFromEngine = {
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