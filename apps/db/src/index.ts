import { createClient } from "redis";
import { DatabaseEngineMessageType } from "@repo/shared-types/types";
import { DatabaseManager } from "./DatabaseManager";
import { redisUrl } from "@repo/shared-types/portsAndUrl";


async function main() {
    const dbManager = new DatabaseManager();
    const redisClient = createClient({ url: redisUrl });
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
