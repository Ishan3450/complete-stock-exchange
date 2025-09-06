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
    base_asset?: string;
    quote_asset?: string;
}

export interface Fill {
    price: number;
    quantity: number;
    fillOwnerId: string;
    tradeId: number;
    marketOrderId: number;
    matchedOrderId: number;
}

export interface Error {
    type: "Error";
    errorMsg: string;
}

export interface UserInterface {
    userId: string;
    balance: Record<string, number>; // currency -> amount
    lockedBalance: Record<string, number>; // currency -> amount
    holdings: Record<string, number>; // base_asset -> quantity
    lockedHolding: Record<string, number>; // base_asset -> quantity
}


export interface Trade extends Fill {
    timestamp: string;
    side: 'buy' | 'sell';
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
    }
} | {
    type: "ENGINE_ADD_BALANCE",
    data: {
        userId: string,
        currency: string,
        amount: number,
    }
} | {
    type: "ENGINE_ADD_HOLDINGS",
    data: {
        userId: string,
        baseAsset: string,
        quantity: number,
    }
} | {
    type: "ENGINE_GET_USER_PORTFOLIO",
    data: {
        userId: string
    }
} | {
    type: "ENGINE_GET_MARKETS_LIST"
} | {
    type: "ENGINE_MARKET_STATS",
};

/**
 * Type: From API to frontend
 */
export type FrontendApiMessageType = Error | {
    type: "SUCCESS",
    userId: number,
} | {
    type: "TICKER",
    success: boolean,
    data?: {
        open: number,
        high: number,
        low: number,
        close: number,
        volume: number,
    }
} | {
    type: "ORDER_SUMMARY",
    orderInfo: {
        price: number,
        quantity: number,
        side: 'buy' | 'sell',
        filled: number,
        base_asset: string,
        quote_asset: string,
    },
    orderTrades: {
        price: number,
        timestamp: string,
        quantity: number,
        side: 'buy' | 'sell',
    }[]
} | {
    type: "USER_ORDERS",
    data: {
        orders: Omit<Order, 'userId'>[]
    }
}


/**
 * Type: From Engine to API
 */
export type ApiEngineMessageType = {
    type: "API_ORDER_PLACED",
    data: {
        orderId: number,
        fills: Omit<Fill, "fillOwnerId">[],
        executedQuantity: number,
    }
} | {
    type: "API_DEPTH",
    data: {
        asks: Record<number, number[]>,
        bids: Record<number, number[]>,
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
    type: "API_TAKE_MARKETS_LIST",
    data: {
        markets: string[]
    }
};

/**
 * Type: From Engine to MarketMaker
 */
export type MarketMakerEngineMessageType = {
    type: "MM_MARKET_STATS",
    data: {
        market: string,
        totalBids: number,
        totalAsks: number,
    }[]
}


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
        trades: Trade[],
        marketName: string,
    }
};

/**
 * Type: From Engine to WS
 */
export type WebsocketEngineMessageType = {
    type: "WS_DEPTH",
    data: {
        market: string,
        bids: Record<number, number[]>,
        asks: Record<number, number[]>,
    }
};

/**
 * Type: From DB to WS
 */
export type WebsocketDatabaseMessageType = {
    type: "WS_TICKER_UPDATE",
    data: {
        market: string,
        open: number,
        high: number,
        low: number,
        close: number,
        volume: number,
    }
} | {
    type: "WS_OHLCV_DATA",
    data: {
        market: string,
        bucket: string,
        data: {
            open: number,
            high: number,
            low: number,
            close: number,
            volume: number,
        }[],
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