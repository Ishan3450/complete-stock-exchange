import { createClient, RedisClientType } from "redis";
import { ApiEngineMessageType, DatabaseEngineMessageType, Error, WebsocketEngineMessageType } from "@repo/shared-types/types";

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

  public async publishMessage(channel: string, message: ApiEngineMessageType | WebsocketEngineMessageType | Error) {
    await this.client.publish(channel, JSON.stringify(message));
  }

  public pushMessageToQueue(channel: string, message: DatabaseEngineMessageType) {
    this.client.lPush(channel, JSON.stringify(message));
  }
}
