import { createClient } from "redis";

async function main() {
  const redisClient = createClient();
  await redisClient.connect();

  while (true) {
    const data = await redisClient.brPop("engineMessages", 0);

    if (data) {
      // process data for engine here
    }
  }
}

main();
