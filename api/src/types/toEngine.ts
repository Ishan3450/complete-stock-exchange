// * Same file as engine/src/types/fromApi.ts

export type MessageToEngine = {
    type: "ENGINE_CREATE_ORDER",
    data: {
        market: string,
        price: number,
        quantity: number,
        side: "buy" | "sell",
        userId: string,
    }
} | {
    type: "ENGINE_CANCEL_ORDER",
    data: {
        orderId: number,
        market: string,
        userId: string,
        side: "buy" | "sell"
    }
} | {
    type: "ENGINE_GET_DEPTH",
    data: {
        market: string,
    }
}