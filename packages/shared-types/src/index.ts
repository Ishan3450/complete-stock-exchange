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

export interface Error {
    type: "Error",
    errorMsg: string,
}

export interface UserInterface {
    userId: string;
    userName: string;
    userPassword: string;
    balance: Record<string, number>; // currency -> amount
    lockedBalance: Record<string, number>; // currency -> amount
    holdings: Record<string, number>; // base_asset -> quantity
    lockedHolding: Record<string, number>; // base_asset -> quantity
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
} | {
    type: "ENGINE_ADD_BALANCE",
    data: {
        userId: string;
        currency: string;
        amount: number;
    }
} | {
    type: "ENGINE_GET_USER_PORTFOLIO",
    data: {
        userId: string
    }
};

/**
 * Type: From api to frontend
 */
export type FrontendApiMessageType = {
    type: "ERROR",
    message: string
} | {
    type: "SUCCESS",
    userId: number,
}


/**
 * Type: From Engine to API
 */
export type ApiEngineMessageType = {
    type: "API_ORDER_PLACED",
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
} | {
    type: "API_USER_PORTFOLIO",
    data: {
        user: UserInterface
    }
} | {
    type: "API_ORDER_CANCELLED",
    data: {

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
export type FrontendWebsocketMessageType = WebsocketEngineMessageType | {
    type: "TAKE_USERID",
    data: {
        userId: string
    }
};

/**
 * Type: From Frontend to WS
 */
export type WebsocketFrontendMessageType = {
    type: "SUBSCRIBE" | "UNSUBSCRIBE",
    data: {
        subscriptionName: string,
    }
};