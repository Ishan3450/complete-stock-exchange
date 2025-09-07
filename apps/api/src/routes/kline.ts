import { Request, Response, Router } from "express";
import { dbClient } from "../dbClient";

export const klineRouter = Router();

klineRouter.get("/", async (req: Request, res: Response) => {
    const { market, timeBucket } = req.query;

    try {
        const response = await dbClient.query(`
        SELECT bucket as time, open, high, low, close
        FROM ${market}_trades_${timeBucket};
        `);

        res.json({
            type: "OHLCV_LINES",
            data: {
                lines: response.rows
            }
        })
    } catch (error: any) {
        if (error.code === '42P01') { // PostgreSQL error code for "relation does not exist"
            res.json({
                type: "Error",
                errorMsg: "Invalid market or time bucket !!"
            });
        }
    }
});