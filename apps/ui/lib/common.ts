export function getFormattedValue(value: number) {
    return Number(value).toFixed(2)
}

export function getOrderState(orderInfo: {
    price: number;
    quantity: number;
    side: "buy" | "sell";
    filled: number;
    isCancelled?: boolean;
}): string {
    if (orderInfo.isCancelled) {
        return "Cancelled";
    }
    if (orderInfo.filled === 0) {
        return "In Progress";
    }
    return orderInfo.quantity === orderInfo.filled ? "Done" : "Partial";
}
