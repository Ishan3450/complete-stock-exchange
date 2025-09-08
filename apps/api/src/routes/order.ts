import { Request, Response, Router } from "express";
import { RedisManager } from "../RedisManager";
import { ApiEngineMessageType } from "@repo/shared-types/types";
import { dbClient } from "../dbClient";

export const orderRouter = Router();

orderRouter.get("/", async (req: Request, res: Response) => {
    const { market, orderId, userId } = req.query;

    if (!orderId || !market || !userId) {
        return res.json({
            type: "Error",
            errorMsg: "Order id or market or user id not found in request params !!"
        });
    }
    const [baseAsset, quoteAsset] = market.toString().split("_");

    if (!baseAsset || !quoteAsset) {
        return res.json({
            type: "Error",
            errorMsg: "Invalid market name !!"
        });
    }

    const orderInfo = await dbClient.query(`
        SELECT
            price, quantity, side, filled, base_asset, quote_asset
        FROM ${market}_orders
        WHERE userid = $1 AND orderid = $2 AND base_asset = $3 AND quote_asset = $4
    `, [userId, orderId, baseAsset, quoteAsset]);

    if (!orderInfo.rowCount) {
        return res.json({
            type: "Error",
            errorMsg: "Order not found"
        })
    }

    const orderTrades = await dbClient.query(`
        SELECT
            price, timestamp, quantity, side
        FROM ${market}_trades
        WHERE marketorderid = $1 OR matchedorderid = $1
    `, [orderId]);

    res.json({
        type: "ORDER_SUMMARY",
        orderInfo: orderInfo.rows[0],
        orderTrades: orderTrades.rows
    });
});

/**
 * TODO: add limit or paging to not fetch tons of orders at a time.
 */
orderRouter.get("/all", async (req: Request, res: Response) => {
    const { userId } = req.query;

    const { rows, rowCount } = await dbClient.query(`
        SELECT ARRAY_AGG(market)
        FROM user_order_markets
        WHERE userid = $1;
    `, [userId]);

    if (!rowCount) {
        return res.json({
            type: "Error",
            errorMsg: "No orders found for this user !!"
        });
    }

    const subQueries: string[] = rows[0]["array_agg"].map((market: string) => (`
        SELECT
            orderid as "orderId",
            price,
            quantity,
            INITCAP(side) as side,
            filled,
            base_asset,
            quote_asset
        FROM ${market}_orders
        WHERE userid = $1
    `));

    const finalQuery = subQueries.join(" UNION ALL ");
    const allOrdersResponse = await dbClient.query(finalQuery, [userId]);

    res.json({
        type: "USER_ORDERS",
        data: {
            orders: allOrdersResponse.rows
        }
    })
})

orderRouter.post("/add", async (req: Request, res: Response) => {
    const { quantity, price, market, side, userId } = req.body;

    const response: ApiEngineMessageType = await RedisManager.getInstance().sendAndAwait({
        type: "ENGINE_CREATE_ORDER",
        data: {
            quantity,
            price,
            market,
            side,
            userId,
        }
    });

    res.status(200).json(response);
});

orderRouter.delete("/cancel", async (req: Request, res: Response) => {
    const { orderId, market, userId, side } = req.body;

    const response: ApiEngineMessageType = await RedisManager.getInstance().sendAndAwait({
        type: "ENGINE_CANCEL_ORDER",
        data: {
            orderId,
            market,
            userId,
            side
        }
    })
    res.status(200).json(response);
});
