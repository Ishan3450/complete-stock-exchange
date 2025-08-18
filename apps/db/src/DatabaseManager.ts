import { RedisClientType } from "@redis/client";
import { redisUrl } from "@repo/shared-types/portsAndUrl";
import { DatabaseEngineMessageType } from "@repo/shared-types/types";
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

        setInterval(this._refreshOhlcvViews, 60 * 1000);
    }

    public process(message: DatabaseEngineMessageType) {
        switch (message.type) {
            case "DB_ADD_TRADES":
                const { trades, marketName } = message.data;
                trades.forEach(trade => this._addTrade(trade, marketName));
                break;
            case "DB_ORDER_UPDATE":
                break;
            case "DB_ORDER_UPDATE_FILL":
                break;
            default:
                break;
        }
    }

    private async _addTrade(trades: { timestamp: string, price: number, quantity: number }, marketName: string): Promise<void> {
        await this._createTableIfNotExists(marketName);
        const insertQuery = `INSERT INTO ${marketName} (price, timestamp, quantity) VALUES($1, $2, $3)`;
        await this.pgClient.query(insertQuery, [trades.price, trades.timestamp, trades.quantity]);
    }

    private async _createTableIfNotExists(tableName: string): Promise<void> {
        tableName = tableName.toLowerCase();
        const query = `
            CREATE TABLE IF NOT EXISTS ${tableName} (
                price           NUMERIC(10,2)   NOT NULL,
                timestamp       TIMESTAMPTZ     NOT NULL,
                quantity        NUMERIC(10,2)   NOT NULL
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
        this.ohlcvViews.add(viewName);

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
    }

    private async _refreshOhlcvViews() {
        this.ohlcvViews?.forEach(async (view) => {
            await this.pgClient.query(`REFRESH MATERIALIZED VIEW ${view}`);

            const { rows } = await this.pgClient.query(`SELECT * FROM ${view}`);
            await this.redisClient.publish(view.toString(), JSON.stringify(rows));
        })
    }
}
