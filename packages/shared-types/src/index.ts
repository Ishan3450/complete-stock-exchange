// ==================================================================
// General Types
// ==================================================================

export interface Order {
    price: number;
    quantity: number;
    side: "buy" | "sell";
    userId: string;
    orderId: number;
    filled: number;
}

export interface Fill {
    price: number;
    quantity: number;
    fillOwnerId: string;
    tradeId: number;
    marketOrderId: number;
}

// ==================================================================


/**
 * Type: From API to Engine
 */
export type EngineApiMessageType = {
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
        side: "buy" | "sell",
    }
} | {
    type: "ENGINE_GET_DEPTH",
    data: {
        market: string,
    }
} | {
    type: "ENGINE_CREATE_USER",
    data: {
        userId: string,
        userName: string,
        userPassword: string,
    }
};


/**
 * Type: From Engine to API
 */
export type ApiEngineMessageType = {
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


/**
 * Type: From Engine to DB
 */
export type DatabaseEngineMessageType = {
    type: "DB_ORDER_UPDATE",
    data: {
        order: Order
    }
} | {
    type: "DB_ORDER_UPDATE_FILL",
    data: {
        fills: Fill[]
    }
} | {
    type: "DB_ADD_TRADES",
    data: {
        trades: { timestamp: string, price: number, quantity: number }[],
        marketName: string,
    }
};

/**
 * Type: From Engine to WS
 */
export type WebsocketEngineMessageType = {
    type: "DEPTH",
    data: {
        market: string,
        bids: Record<number, number>,
        asks: Record<number, number>,
    }
} | {
    type: "TICKER_UPDATE",
    data: {
        market: string,
        open: number,
        high: number,
        low: number,
        close: number,
        volume: number,
    }
};

/**
 * Type: From WS to Frontend
 */
export type FrontendWebsocketMessageType = WebsocketEngineMessageType;

/**
 * Type: From Frontend to WS
 */
export type WebsocketFrontendMessageType = {
    type: "SUBSCRIBE" | "UNSUBSCRIBE",
    data: {
        subscriptionName: string,
    }
};