import { createClient } from "redis";
import { Engine } from "./Engine";

async function main() {
  const redisClient = createClient();
  await redisClient.connect();
  const engine = Engine.getInstance();

  while (true) {
    const data = await redisClient.brPop("engineMessages", 0);

    if (data) {
      await engine.process(JSON.parse(data.element));
    }
  }
}

