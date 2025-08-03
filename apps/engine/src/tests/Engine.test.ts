import { createClient, RedisClientType } from "redis";
import { Engine } from "../Engine";
import { ApiEngineMessageType, UserInterface } from "@repo/shared-types/src";

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
        engine.addMarket("TATA", "INR");
    });

    beforeEach(async () => {
        await engine.process({
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
        await engine.process({
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

    test("Test ENGINE_CREATE_ORDER", async () => {
        let beforeUser1: UserInterface, beforeUser2: UserInterface;
        let afterUser1: UserInterface, afterUser2: UserInterface;

        await new Promise<void>(async (resolve, reject) => {
            await sub.subscribe("1", async (message: string) => {
                const parsedMessage: ApiEngineMessageType = JSON.parse(message);

                if (parsedMessage.type === "API_USER_PORTFOLIO") {
                    const user = parsedMessage.data.user;
                    switch (user.userId) {
                        case "1":
                            if (!beforeUser1) {
                                beforeUser1 = user;
                            } else {
                                afterUser1 = user;
                            }
                            break;
                        case "2":
                            if (!beforeUser2) {
                                beforeUser2 = user;
                            } else {
                                afterUser2 = user;
                            }
                            break;
                    }

                    if (beforeUser1 && beforeUser2 && afterUser1 && afterUser2) {
                        try {
                            console.log('bu1', beforeUser1);
                            console.log('bu2', beforeUser2);
                            console.log('au1', afterUser1);
                            console.log('au2', afterUser2);

                            // TODO: checks will be here

                            resolve(); // resume after all the checks
                        } catch (err) {
                            reject(err);
                        }
                    }
                }
            });

            // Get initial portfolios
            await engine.process({ clientId: "1", message: { type: "ENGINE_GET_USER_PORTFOLIO", data: { userId: "1" } } });
            await engine.process({ clientId: "1", message: { type: "ENGINE_GET_USER_PORTFOLIO", data: { userId: "2" } } });

            // Perform transactions
            await engine.process({
                clientId: "1",
                message: {
                    type: "ENGINE_CREATE_ORDER",
                    data: { market: "TATA_INR", price: 100, quantity: 2, side: "buy", userId: "1" }
                }
            });
            await engine.process({
                clientId: "1",
                message: {
                    type: "ENGINE_CREATE_ORDER",
                    data: { market: "TATA_INR", price: 98, quantity: 1, side: "sell", userId: "2" }
                }
            });

            // Get updated portfolios
            await engine.process({ clientId: "1", message: { type: "ENGINE_GET_USER_PORTFOLIO", data: { userId: "1" } } });
            await engine.process({ clientId: "1", message: { type: "ENGINE_GET_USER_PORTFOLIO", data: { userId: "2" } } });
        });
    });


    afterEach(async () => {
        await sub.unsubscribe("1");
    })

    afterAll(async () => {
        await pub.quit();
        await sub.quit();
    });
});