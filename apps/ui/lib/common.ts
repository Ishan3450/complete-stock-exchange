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
    if (Number(orderInfo.filled) === 0) {
        return "In Progress";
    }
    return Number(orderInfo.quantity) === Number(orderInfo.filled) ? "Done" : "Partial";
}
