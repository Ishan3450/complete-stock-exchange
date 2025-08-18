import { createClient, RedisClientType } from 'redis';
import { User } from './User';
import WebSocket from 'ws';
import { v4 as uuid } from "uuid";
import { redisUrl } from '@repo/shared-types/portsAndUrl';

export class UserManager {
    private static instance: UserManager;
    private redisClient: RedisClientType;
    private users: Map<string, User>; // userId -> User class object

    private constructor() {
        this.redisClient = createClient({ url: redisUrl });
        this.users = new Map();
        this.redisClient.connect();
    }

    static getInstance(): UserManager {
        if (!this.instance) {
            this.instance = new UserManager();
        }
        return this.instance;
    }

    public addUser(ws: WebSocket): void {
        const userId: string = uuid();
        const user = new User(userId, ws);
        this.users.set(userId, user);

        // immediately respond back the user with the ws user id
        user.emit({
            type: "TAKE_USERID",
            data: { userId }
        });
        console.log(`User added ${userId}`);
    }

    public getUser(userId: string): User {
        if (!this.users.has(userId)) {
            throw new Error("No user found");
        }
        return this.users.get(userId)!;
    }

    public removeUser(userId: string): void {
        this.users.delete(userId);
    }
}