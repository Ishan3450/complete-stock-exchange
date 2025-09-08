import express, { Request, Response } from 'express';
import cors from "cors";
import { orderRouter } from './routes/order';
import { tickerRouter } from './routes/ticker';
import { tradesRouter } from './routes/trades';
import { klineRouter } from './routes/kline';
import { depthRouter } from './routes/depth';
import { authRouter } from './routes/auth';
import { apiUrl, baseUrl, apiPort } from "@repo/shared-types/portsAndUrl"
import { ApiEngineMessageType } from '@repo/shared-types/types';
import { RedisManager } from './RedisManager';
import { portfolioRouter } from './routes/portfolio';

const app = express();

app.use(cors());
app.use(express.json());

app.use(`${baseUrl}/auth`, authRouter);
app.use(`${baseUrl}/order`, orderRouter);
app.use(`${baseUrl}/ticker`, tickerRouter);
app.use(`${baseUrl}/trades`, tradesRouter);
app.use(`${baseUrl}/klines`, klineRouter);
app.use(`${baseUrl}/depth`, depthRouter);
app.use(`${baseUrl}/portfolio`, portfolioRouter);

app.get(`${baseUrl}/markets`, async (req: Request, res: Response) => {
  const response: ApiEngineMessageType = await RedisManager.getInstance().sendAndAwait({
    type: "ENGINE_GET_MARKETS_LIST",
  });

  if (response.type === "API_TAKE_MARKETS_LIST") {
    return res.json(response.data);
  }
});

app.listen(apiPort, () => {
  console.log(`Server is running at ${apiUrl}`);
});