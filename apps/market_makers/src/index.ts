import { redisUrl } from "@repo/shared-types/portsAndUrl";
import { createClient } from "redis";

const MAX_ALLOWED = 15;
const redisClient = createClient({ url: redisUrl });

async function init() {
    await redisClient.connect();
    main();
}

async function main() {
    
}

init();