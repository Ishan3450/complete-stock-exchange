import { createClient } from "redis";
import { DatabaseEngineMessageType } from "@repo/shared-types/src/index";
import { DatabaseManager } from "./DatabaseManager";


async function main() {
    const dbManager = new DatabaseManager();
    const redisClient = createClient();
    await redisClient.connect();

    while (true) {
        // BRPOP returns: [key, value] equivalent to [queue, message]
        const message = await redisClient.brPop("db_processor", 0);

        if (message) {
            const parsedMessage: DatabaseEngineMessageType = JSON.parse(message.element);
            dbManager.process(parsedMessage);
        }
    }
}
main();
