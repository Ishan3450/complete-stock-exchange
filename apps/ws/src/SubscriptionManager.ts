import { WebsocketFrontendMessageType } from '@repo/shared-types/src/index';
import { createClient, RedisClientType } from 'redis';
import { User } from './User';


export class SubscriptionManager {
    private static instance: SubscriptionManager;
    private redisClient: RedisClientType;
    private subscriptions: Map<string, Set<User>>; // channel -> list<User>

    private constructor() {
        this.redisClient = createClient();
        this.redisClient.connect();
        this.subscriptions = new Map();
    }

    public static getInstance(): SubscriptionManager {
        if (!this.instance) {
            this.instance = new SubscriptionManager();
        }
        return this.instance;
    }

    public subscribe(message: WebsocketFrontendMessageType) {

    }

    public unsubscribe(message: WebsocketFrontendMessageType) {

    }
}