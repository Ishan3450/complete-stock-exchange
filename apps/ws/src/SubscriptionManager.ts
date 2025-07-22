import { WebsocketFrontendMessageType } from '@repo/shared-types/src/index';
import { createClient, RedisClientType } from 'redis';
import { User } from './User';
import { UserManager } from './UserManager';


export class SubscriptionManager {
    private static instance: SubscriptionManager;
    private redisClient: RedisClientType;
    private subscriptions: Map<string, Set<string>>; // channel -> list<userId>

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
        const subscriptionName = message.data.subscriptionName;
        if (!this.subscriptions.has(subscriptionName)) {
            this.subscriptions.set(subscriptionName, new Set());
        }
        this.subscriptions.get(subscriptionName)?.add(message.data.userId);

        if (this.subscriptions.get(subscriptionName)?.size == 1) {
            this.redisClient.subscribe(subscriptionName, this._pubSubCallbackHandler)
        }
    }

    private _pubSubCallbackHandler(message: string, channel: string) {
        const parsedMessage = JSON.parse(message);
        this.subscriptions.get(channel)?.forEach(userId => {
            UserManager.getInstance().getUser(userId).emit(parsedMessage);
        })
    }

    public unsubscribe(message: WebsocketFrontendMessageType) {
        const subscriptionName = message.data.subscriptionName;
        const userId = message.data.userId;
        const subscribers = this.subscriptions.get(subscriptionName);

        if (subscribers) {
            subscribers.delete(userId);

            if (subscribers.size === 0) {
                this.redisClient.unsubscribe(subscriptionName);
                this.subscriptions.delete(subscriptionName);
            }
        }
    }
}