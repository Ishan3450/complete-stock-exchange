import { Order } from "@repo/shared-types/types";

type OrderBookProps = {
    market: string;
}

export default function OrderBook({ market }: OrderBookProps) {
    return <div className="p-3">
        Orderbook for {market}
    </div>
}