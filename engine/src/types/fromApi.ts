// * Same file as api/src/types/toEngine.ts

const CANCEL_ORDER: string = "CANCEL_ORDER";
const CREATE_ORDER: string = "CREATE_ORDER";
const GET_DEPTH: string = "GET_DEPTH";
const GET_OPEN_ORDERS: string = "GET_OPEN_ORDERS";

export type MessageFromApiServer = {
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