import { ApiEngineMessageType } from "@repo/shared-types/types";
import { Request, Response, Router } from "express";
import { RedisManager } from "../RedisManager";

export const portfolioRouter = Router();

portfolioRouter.post("/get", async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
        res.json({
            type: "ERROR",
            message: "No user id found to get the portfolio !!",
        })
    }
    const response: ApiEngineMessageType = await RedisManager.getInstance().sendAndAwait({
        type: "ENGINE_GET_USER_PORTFOLIO",
        data: { userId }
    })
    res.status(200).json(response);
});
