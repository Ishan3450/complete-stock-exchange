import { createClient, RedisClientType } from "redis";
import { MessageToApiServer } from "./types/toApi";
import { MessageToWsServer } from "./types/toWs";

export class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType;

  private constructor() {
    this.client = createClient();
    this.client.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public publicMessageToQueue(channel: string, message: MessageToApiServer | MessageToWsServer) {
    this.client.publish(channel, JSON.stringify(message));
  }
}
