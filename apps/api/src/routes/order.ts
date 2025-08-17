import { Request, Response, Router } from "express";
import { RedisManager } from "../RedisManager";
import { ApiEngineMessageType } from "@repo/shared-types/types";

export const orderRouter = Router();

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