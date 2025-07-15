// Same file as engine/src/types/toApi.ts
// Fill from engine/src/OrderBook.ts

export interface Fill {
    price: number;
    quantity: number;
    fillOwnerId: string;
    tradeId: number;
    marketOrderId: number;
}

export type MessageFromEngine = {
    type: "API_ORDER_PLACED" | "API_ORDER_CANCELLED",
    data: {
        orderId: number,
        fills: Fill[],
        executedQuantity: number,
    }
} | {
    type: "API_DEPTH",
    data: {
        asks: Record<number, number>,
        bids: Record<number, number>,
    }
} | {
    type: "API_USER_CREATED",
    data: {
        status: boolean
    }
};