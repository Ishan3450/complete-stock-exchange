import { createClient, RedisClientType } from 'redis';
import { UserManager } from './UserManager';
import { redisUrl } from '@repo/shared-types/portsAndUrl';


export class SubscriptionManager {
    private static instance: SubscriptionManager;
    private redisClient: RedisClientType;
    private subscriptions: Map<string, Set<string>>; // channel -> list<userId>
    private userSubscriptions: Map<string, Set<string>>; // userId > list<channel>

    private constructor() {
        this.redisClient = createClient({ url: redisUrl });
        this.redisClient.connect();
        this.subscriptions = new Map();
        this.userSubscriptions = new Map();
    }

    public static getInstance(): SubscriptionManager {
        if (!this.instance) {
            this.instance = new SubscriptionManager();
        }
        return this.instance;
    }

    public subscribe(subscriptionName: string, userId: string) {
        if (!this.subscriptions.has(subscriptionName)) {
            this.subscriptions.set(subscriptionName, new Set());
        }
        if (!this.userSubscriptions.has(userId)) {
            this.userSubscriptions.set(userId, new Set());
        }
        this.subscriptions.get(subscriptionName)?.add(userId);
        this.userSubscriptions.get(userId)?.add(subscriptionName);

        if (this.subscriptions.get(subscriptionName)?.size == 1) {
            this.redisClient.subscribe(subscriptionName, this._pubSubCallbackHandler)
        }

        console.log(`${userId} subscribed to ${subscriptionName}`);
    }

    public unsubscribe(subscriptionName: string, userId: string) {
        const subscribers = this.subscriptions.get(subscriptionName);

        if (subscribers) {
            subscribers.delete(userId);
            this.userSubscriptions.get(userId)?.delete(subscriptionName);

            if (subscribers.size === 0) {
                this.redisClient.unsubscribe(subscriptionName);
                this.subscriptions.delete(subscriptionName);
                this.userSubscriptions.delete(userId);
            }
        }
        console.log(`${userId} unsubscribed to ${subscriptionName}`);
    }

    private _pubSubCallbackHandler(message: string, channel: string) {
        this.subscriptions.get(channel)?.forEach(userId => {
            UserManager.getInstance().getUser(userId).emit(message);
        })
    }

    public userLeft(userId: string) {
        this.userSubscriptions.get(userId)?.forEach(subscription => {
            this.subscriptions.get(subscription)?.delete(userId);
        })
        this.userSubscriptions.delete(userId);
    }
}