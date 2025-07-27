import { createClient, RedisClientType } from "redis";
import { Engine } from "../Engine";

describe("Engine Tests", () => {
    let engine: Engine;
    let pub: RedisClientType;
    let sub: RedisClientType;
    let CLIENT_ID = "1";

    beforeAll(async () => {
        engine = Engine.getInstance();
        pub = createClient();
        sub = createClient();
        await pub.connect();
        await sub.connect();
    });

    beforeEach(() => {
        engine.process({
            clientId: CLIENT_ID,
            message: {
                type: "ENGINE_CREATE_USER",
                data: {
                    userId: "1",
                    userName: "User 1",
                    userPassword: "Pwd"
                }
            }
        });
        engine.process({
            clientId: CLIENT_ID,
            message: {
                type: "ENGINE_CREATE_USER",
                data: {
                    userId: "2",
                    userName: "User 2",
                    userPassword: "Pwd"
                }
            }
        });
    })

    test("Test ENGINE_CREATE_ORDER", () => {
        
    });

    afterAll(async () => {
        pub.destroy();
        sub.destroy();
    });
});