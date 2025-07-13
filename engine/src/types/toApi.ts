import { Fill } from "../OrderBook";

export type MessageToApiServer = {
    type: "ORDER_PLACED" | "ORDER_CANCELLED",
    data: {
        orderId: number,
        fills: Fill[],
        executedQuantity: number,
    }
};