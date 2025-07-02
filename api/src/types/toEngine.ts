import { CANCEL_ORDER, CREATE_ORDER, GET_DEPTH, GET_OPEN_ORDERS } from ".";

export type MessageToEngine = {
    type: typeof CREATE_ORDER,
    data: {
        market: string,
        price: number,
        quantity: number,
        side: "BUY" | "SELL",
        userId: string,
    }
} | {
    type: typeof CANCEL_ORDER,
    data: {
        orderId: string,
        market: string,
        userId: string,
    }
} | {
    type: typeof GET_DEPTH,
    data: {
        market: string,
    }
} | {
    type: typeof GET_OPEN_ORDERS,
    data: {
        userId: string,
        market: string,
    }
}