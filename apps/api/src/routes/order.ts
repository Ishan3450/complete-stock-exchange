import { Request, Response, Router } from "express";
import { RedisManager } from "../RedisManager";
import { ApiEngineMessageType } from "@repo/shared-types/types";
import { dbClient } from "../dbClient";

export const orderRouter = Router();

orderRouter.get("/", async (req: Request, res: Response) => {
    const { market, orderId } = req.query;

    if (!orderId || !market) {
        return res.json({
            type: "Error",
            errorMsg: "Order id or market not found in query param !!"
        })
    }
    const [baseAsset, quoteAsset] = market.toString().split("_");

    const orderInfo = await dbClient.query(`
        SELECT
            price, quantity, side, filled, base_asset, quote_asset
        FROM ${market}_orders
        WHERE orderid = $1 AND base_asset = $2 AND quote_asset = $3
    `, [orderId, baseAsset, quoteAsset]);

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
        WHERE marketorderid = $1
    `, [orderId]);

    res.json({
        type: "ORDER_SUMMARY",
        orderInfo: orderInfo.rows,
        orderTrades: orderTrades.rows
    })
});

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
