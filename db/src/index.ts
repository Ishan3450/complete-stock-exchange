import { Client } from "pg";
import { createClient } from "redis";
import { DBMessageFromEngine } from "./types/fromEngine";

const pgClient = new Client({
    user: "postgres",
    host: "localhost",
    database: "exchange_db",
    password: "postgres",
    port: 5432,
});

async function main() {
    const redisClient = createClient();
    await pgClient.connect();
    await redisClient.connect();
    console.log("DB Connected: REDIS");
    console.log("DB Connected: PG CLIENT");

    while (true) {
        // BRPOP returns: [key, value] equivalent to [queue, message]
        const message = await redisClient.brPop("db_processor", 0);

        if (message) {
            const parsedMessage: DBMessageFromEngine = JSON.parse(message.element);

            switch (parsedMessage.type) {
                case "DB_ORDER_UPDATE":
                    break;
                case "DB_ORDER_UPDATE_FILL":
                    break;
                case "DB_ADD_TRADES":
                    break;
                default:
                    break;
            }
        }
    }
}

main();