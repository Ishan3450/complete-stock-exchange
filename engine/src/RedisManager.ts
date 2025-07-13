import { createClient, RedisClientType } from "redis";
import { MessageToApiServer } from "./types/toApi";

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

  public sendToApiServer(clientId: string, message: MessageToApiServer) {
    this.client.publish(clientId, JSON.stringify(message));
  }
}
