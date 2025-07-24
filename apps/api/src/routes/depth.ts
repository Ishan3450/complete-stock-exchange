import { Request, Response, Router } from "express";
import { RedisManager } from "../RedisManager";
import { ApiEngineMessageType } from "@repo/shared-types/src";

export const depthRouter = Router();

depthRouter.get("/get", async (req: Request, res: Response) => {
    const market = typeof req.query.market === "string" ? req.query.market : undefined;

    if (!market) {
        return res.status(400).json({
            type: "ERROR",
            errorMsg: "Market parameter is required and must be a string."
        });
    }

    const response: ApiEngineMessageType = await RedisManager.getInstance().sendAndAwait({
        type: "ENGINE_GET_DEPTH",
        data: {
            market
        }
    })
    res.status(200).json(response);
})