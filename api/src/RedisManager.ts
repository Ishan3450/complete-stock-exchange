import { createClient, RedisClientType } from "redis";
import { MessageToEngine } from "./types/toEngine";
import { MessageFromEngine } from "./types/fromEngine";
import { v4 as uuid } from 'uuid';

export class RedisManager {
    private client: RedisClientType;
    private publisher: RedisClientType;
	private static instance: RedisManager;

    private constructor() {
        this.client = createClient();
        this.publisher = createClient();
		this.client.connect();
        this.publisher.connect();
    }

	public static getInstance() {
		if(!this.instance) {
			this.instance = new RedisManager();
		}
		return this.instance;
	}

	public sendAndAwait(message: MessageToEngine) {
		return new Promise<MessageFromEngine>((resolve, reject) => {
			const id = uuid();
			this.client.subscribe(id, (response) => {
				this.client.unsubscribe(id);
				resolve(JSON.parse(response));
			});
			this.publisher.lPush("messages", JSON.stringify({ clientId: id, message }))
		})
	}
}