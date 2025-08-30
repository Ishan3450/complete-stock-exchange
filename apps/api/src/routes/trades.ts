import { Request, Response, Router } from "express";
import { dbClient } from "../dbClient";

export const tradesRouter = Router();

tradesRouter.get('/get', async (req: Request, res: Response) => {
    const { market } = req.query;
    const { rows } = await dbClient.query(`
        SELECT 
            * 
        FROM ${market}
        ORDER BY timestamp DESC 
        LIMIT 100
    `);
    res.json(rows);
});