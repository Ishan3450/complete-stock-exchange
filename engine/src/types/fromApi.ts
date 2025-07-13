// * Same file as api/src/types/toEngine.ts

export type MessageFromApiServer = {
    type: "CREATE_ORDER",
    data: {
        market: string,
        price: number,
        quantity: number,
        side: "buy" | "sell",
        userId: string,
    }
} | {
    type: "CANCEL_ORDER",
    data: {
        orderId: number,
        market: string,
        userId: string,
        side: "buy" | "sell"
    }
} | {
    type: "GET_DEPTH",
    data: {
        market: string,
    }
}