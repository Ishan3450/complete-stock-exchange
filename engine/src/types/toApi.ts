// Same file as api/arc/types/fromEngine.ts

import { Fill } from "../OrderBook";

export type MessageToApiServer = {
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