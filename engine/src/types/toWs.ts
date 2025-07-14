import { Order } from "../OrderBook";

export type MessageToWsServer = {
    stream: string,
    data: {
        type: "depth",
        bids: Record<number, number>,
        asks: Record<number, number>,
    }
};