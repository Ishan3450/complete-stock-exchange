import express, { Request, Response } from 'express';
import cors from "cors";
import { orderRouter } from './routes/order';
import { tickerRouter } from './routes/ticker';
import { tradesRouter } from './routes/trades';
import { klineRouter } from './routes/kline';
import { depthRouter } from './routes/depth';

const app = express();
const port: number = 3000;
const baseUrl: string = "/api/v1"

app.use(cors());
app.use(express.json());

app.use(`${baseUrl}/order`, orderRouter);
app.use(`${baseUrl}/ticker`, tickerRouter);
app.use(`${baseUrl}/trades`, tradesRouter);
app.use(`${baseUrl}/klines`, klineRouter);
app.use(`${baseUrl}/depth`, depthRouter);

app.get('/health', (req: Request, res: Response) => {
  res.send('Healthy!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});