import { createClient, RedisClientType } from 'redis';
import { User } from './User';
import WebSocket from 'ws';
import { v4 as uuid } from "uuid";

export class UserManager {
    private static instance: UserManager;
    private redisClient: RedisClientType;
    private users: Map<string, User>; // userId -> User class object

    private constructor() {
        this.redisClient = createClient();
        this.users = new Map();
        this.redisClient.connect();
    }

    static getInstance(): UserManager {
        if (!this.instance) {
            this.instance = new UserManager();
        }
        return this.instance;
    }

    public addUser(ws: WebSocket) {
        const userId: string = uuid();
        const user = new User(userId, ws);
        this.users.set(userId, user);
    }

    public getUser(userId: string): User {
        if (!this.users.has(userId)) {
            throw new Error("No user found");
        }
        return this.users.get(userId)!;
    }
}