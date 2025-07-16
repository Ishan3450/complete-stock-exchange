import { createClient, RedisClientType } from "redis";
import { ApiEngineMessageType, EngineDatabaseMessageType, EngineWebsocketMessageType } from "@repo/shared-types/src/index";

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

  public publishMessageToQueue(channel: string, message: ApiEngineMessageType | EngineWebsocketMessageType | EngineDatabaseMessageType) {
    this.client.publish(channel, JSON.stringify(message));
  }
}
