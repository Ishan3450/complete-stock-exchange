import { RedisClientType } from "@redis/client";
import { redisUrl } from "@repo/shared-types/portsAndUrl";
import { DatabaseEngineMessageType, Trade, WebsocketDatabaseMessageType } from "@repo/shared-types/types";
import { Client } from "pg";
import { createClient } from "redis";


export class DatabaseManager {
    private pgClient: Client;
    private redisClient: RedisClientType;
    private ohlcvViews: Set<String>;

    constructor() {
        this.pgClient = new Client({
            user: "postgres",
            host: "localhost",
            database: "exchange_db",
            password: "postgres",
            port: 5432,
        });
        this.redisClient = createClient({ url: redisUrl });
        this.ohlcvViews = new Set();

        this.pgClient.connect();
        this.redisClient.connect();

        // setInterval(async () => {
        //     await this._refreshOhlcvViews();
        // }, 30 * 1000);
    }

    public async process(message: DatabaseEngineMessageType) {
        switch (message.type) {
            case "DB_ADD_TRADES":
                const { trades, marketName } = message.data;
                for (const trade of trades) {
                    await this._addTrade(trade, marketName);
                }
                break;
            case "DB_ORDER_UPDATE":
                break;
            case "DB_ORDER_UPDATE_FILL":
                break;
            default:
                break;
        }
    }

    private async _addTrade(trade: Trade, marketName: string): Promise<void> {
        await this._createTableIfNotExists(marketName);
        const insertQuery = `
            INSERT INTO ${marketName}_trades (price, timestamp, quantity, side, fillOwnerId, marketOrderId, tradeId, matchedorderid)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await this.pgClient.query(
            insertQuery,
            [
                trade.price, trade.timestamp, trade.quantity, trade.side,
                trade.fillOwnerId, trade.marketOrderId, trade.tradeId, trade.matchedOrderId
            ]
        );
        await this._refreshOhlcvViews();
    }

    private async _createTableIfNotExists(tableName: string): Promise<void> {
        tableName = `${tableName.toLowerCase()}_trades`;
        const query = `
            CREATE TABLE IF NOT EXISTS ${tableName} (
                tradeId          INT             NOT NULL    PRIMARY KEY,
                price            NUMERIC(10,2)   NOT NULL,
                timestamp        TIMESTAMPTZ     NOT NULL,
                quantity         NUMERIC(10,2)   NOT NULL,
                side             VARCHAR         NOT NULL,
                fillOwnerId      INT             NOT NULL,
                marketOrderId    INT             NOT NULL,
                matchedOrderId   INT             NOT NULL
            );
        `;
        await this.pgClient.query(query);
        await this._initializeMaterializedViews(tableName);
    }

    private async _initializeMaterializedViews(tableName: string): Promise<void> {
        const buckets = ['minute', 'hour', 'day', 'week', 'month', 'year'];
        buckets.forEach(async (bucket) => {
            await this._createMaterializedViewOHLCV(tableName, bucket);
        });
    }

    private async _createMaterializedViewOHLCV(tableName: string, bucketType: string) {
        const viewName = `${tableName}_${bucketType}`;

        const sql = `
            CREATE MATERIALIZED VIEW IF NOT EXISTS "${viewName}" AS
            SELECT
                date_trunc('${bucketType}', timestamp) as bucket,
                FIRST(price, timestamp) AS open,
                MAX(price) AS high,
                MIN(price) AS low,
                LAST(price, timestamp) AS close,
                SUM(quantity) AS volume
            FROM "${tableName}"
            GROUP BY bucket
            ORDER BY bucket;
        `;
        await this.pgClient.query(sql);
        this.ohlcvViews.add(viewName);
    }

    private async _refreshOhlcvViews() {
        for (const view of this.ohlcvViews) {
            const splitted = view.split("_");

            await this.pgClient.query(`REFRESH MATERIALIZED VIEW ${view}`);

            const { rows } = await this.pgClient.query<{
                open: number;
                high: number;
                low: number;
                close: number;
                volume: number;
                time: string;
            }>(`SELECT open, high, low, close, volume, bucket as time FROM ${view}`);

            const viewData: WebsocketDatabaseMessageType = {
                type: "WS_OHLCV_DATA",
                data: {
                    market: `${splitted[0]}_${splitted[1]}`,
                    bucket: splitted[3]!, // not splitted[2] is 'trades' eg. tata_inr_trades_day
                    lines: rows
                }
            }
            await this.redisClient.publish(view.toString().toUpperCase(), JSON.stringify(viewData));

            // udpated ticker data
            if (view.endsWith("_day") && rows.length >= 1) {
                const { open, high, low, close, volume } = rows[rows.length - 1]!;
                const dataToSend: WebsocketDatabaseMessageType = {
                    type: "WS_TICKER_UPDATE",
                    data: {
                        market: view.substring(0, view.length - 11),
                        open,
                        high,
                        low,
                        close,
                        volume,
                    }
                }
                await this.redisClient.publish(view.substring(0, view.lastIndexOf("_")).toUpperCase(), JSON.stringify(dataToSend))
            }
        }
    }
}
