import { Request, Response, Router } from "express";
import { dbClient } from "../dbClient";


export const tickerRouter = Router();

tickerRouter.get('/get', async (req: Request, res: Response) => {
    const { market } = req.query;

    if (!market) {
        console.log("Market not found for the ticker API request !!");
        return res.json({
            type: "TICKER",
            success: false,
        })
    }

    const { rows } = await dbClient.query(`
        SELECT
            open, high, low, close, volume
        FROM ${market.toString().toLowerCase()}_trades_day
        ORDER BY bucket DESC
        LIMIT 1
    `);

    if (rows.length >= 1) {
        const { open, high, low, close, volume } = rows[0];
        return res.json({
            type: "TICKER",
            success: true,
            data: {
                open, high, low, close, volume
            }
        });
    }
    res.json({
        type: "TICKER",
        success: false,
    })
})