import { createClient, RedisClientType } from "redis";
import { Engine } from "../Engine";
import { ApiEngineMessageType, Error, UserInterface } from "@repo/shared-types/types";

describe("Engine Tests", () => {
    let engine: Engine;
    let pub: RedisClientType;
    let sub: RedisClientType;
    let CLIENT_ID = "1";

    beforeEach(async () => {
        engine = Engine.getInstance();
        pub = createClient();
        sub = createClient();
        await pub.connect();
        await sub.connect();
        engine.addMarket("TATA", "INR");
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

    test("Test ENGINE_CREATE_ORDER - first buy then sell", async () => {
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
                            expect(afterUser1.balance["INR"] ?? 0).toEqual((beforeUser1.balance["INR"] ?? 0) - 200);
                            expect(afterUser1.lockedBalance["INR"] ?? 0).toEqual(100);
                            expect(afterUser1.holdings["TATA"] ?? 0).toEqual((beforeUser1.holdings["TATA"] ?? 0) + 1);

                            expect(afterUser2.holdings["TATA"] ?? 0).toEqual((beforeUser2.holdings["TATA"] ?? 0) - 1);
                            expect(afterUser2.lockedHolding).toEqual({});
                            expect(afterUser2.balance["INR"] ?? 0).toEqual((beforeUser2.balance["INR"] ?? 0) + 100);

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
    test("Test ENGINE_CREATE_ORDER - first sell then buy", async () => {
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
                            expect(afterUser2.balance["INR"] ?? 0).toEqual((beforeUser2.balance["INR"] ?? 0) + 98);
                            expect(afterUser2.holdings["TATA"] ?? 0).toEqual((beforeUser2.holdings["TATA"] ?? 0) - 1);
                            expect(afterUser2.lockedHolding).toEqual({});

                            expect(afterUser1.balance["INR"] ?? 0).toEqual((beforeUser1.balance["INR"] ?? 0) - 200);
                            expect(afterUser1.lockedBalance["INR"] ?? 0).toEqual(102);
                            expect(afterUser1.holdings["TATA"] ?? 0).toEqual((beforeUser1.holdings["TATA"] ?? 0) + 1);

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
                    data: { market: "TATA_INR", price: 98, quantity: 1, side: "sell", userId: "2" }
                }
            });
            await engine.process({
                clientId: "1",
                message: {
                    type: "ENGINE_CREATE_ORDER",
                    data: { market: "TATA_INR", price: 100, quantity: 2, side: "buy", userId: "1" }
                }
            });

            // Get updated portfolios
            await engine.process({ clientId: "1", message: { type: "ENGINE_GET_USER_PORTFOLIO", data: { userId: "1" } } });
            await engine.process({ clientId: "1", message: { type: "ENGINE_GET_USER_PORTFOLIO", data: { userId: "2" } } });
        });
    });

    test("Test ENGINE_CANCEL_ORDER - Sell order", async () => {
        let beforeUser: UserInterface;
        let orderId: number = -1;

        await new Promise<void>(async (resolve) => {
            await sub.subscribe("1", async (message: string) => {
                const parsedMessage: ApiEngineMessageType = JSON.parse(message);
                if (parsedMessage.type === "API_ORDER_PLACED") {
                    orderId = parsedMessage.data.orderId;
                    await sub.unsubscribe("1");
                    resolve();
                }
            });
            await engine.process({
                clientId: "1",
                message: {
                    type: "ENGINE_CREATE_ORDER",
                    data: { market: "TATA_INR", price: 98, quantity: 1, side: "sell", userId: "2" }
                }
            });
        });

        await new Promise<void>(async (resolve) => {
            await sub.subscribe("USER", async (message: string) => {
                const parsedMessage: ApiEngineMessageType = JSON.parse(message);
                if (parsedMessage.type === "API_USER_PORTFOLIO") {
                    beforeUser = parsedMessage.data.user;
                    await sub.unsubscribe("USER");
                    resolve();
                }
            });
            await engine.process({ clientId: "USER", message: { type: "ENGINE_GET_USER_PORTFOLIO", data: { userId: "2" } } });
        });

        // this will console log that order is not found
        await new Promise<void>(async (resolve) => {
            await sub.subscribe("TEST_INVALID_ORDER", async (msg) => {
                const parsedMessage: ApiEngineMessageType | Error = JSON.parse(msg);
                expect(parsedMessage.type).toEqual("Error");
                await sub.unsubscribe("TEST_INVALID_ORDER");
                resolve()
            });
            await engine.process({
                clientId: "TEST_INVALID_ORDER",
                message: {
                    type: "ENGINE_CANCEL_ORDER",
                    data: { market: "TATA_INR", orderId: orderId + 1, side: "sell", userId: "2" }
                }
            });
        });

        await new Promise<void>(async (resolve) => {
            await sub.subscribe("VALID_ORDER", async (msg) => {
                const parsedMessage: ApiEngineMessageType = JSON.parse(msg);

                if (beforeUser && parsedMessage.type === "API_USER_PORTFOLIO") {
                    const afterUser: UserInterface = parsedMessage.data.user;
                    expect(afterUser.lockedHolding).toEqual({});
                    expect(afterUser.holdings["TATA"]).toEqual(beforeUser.holdings["TATA"]! + 1);
                    await sub.unsubscribe("VALID_ORDER");
                    resolve();
                }
            });
            await engine.process({
                clientId: "VALID_ORDER",
                message: {
                    type: "ENGINE_CANCEL_ORDER",
                    data: { market: "TATA_INR", orderId: orderId, side: "sell", userId: "2" }
                }
            });
        });
    });
    test("Test ENGINE_CANCEL_ORDER - Buy order", async () => {
        let beforeUser: UserInterface;
        let orderId: number = -1;

        await new Promise<void>(async (resolve) => {
            await sub.subscribe("1", async (message: string) => {
                const parsedMessage: ApiEngineMessageType = JSON.parse(message);
                if (parsedMessage.type === "API_ORDER_PLACED") {
                    orderId = parsedMessage.data.orderId;
                    await sub.unsubscribe("1");
                    resolve();
                }
            });
            await engine.process({
                clientId: "1",
                message: {
                    type: "ENGINE_CREATE_ORDER",
                    data: { market: "TATA_INR", price: 98, quantity: 1, side: "buy", userId: "2" }
                }
            });
        });

        await new Promise<void>(async (resolve) => {
            await sub.subscribe("USER", async (message: string) => {
                const parsedMessage: ApiEngineMessageType = JSON.parse(message);
                if (parsedMessage.type === "API_USER_PORTFOLIO") {
                    beforeUser = parsedMessage.data.user;
                    await sub.unsubscribe("USER");
                    resolve();
                }
            });
            await engine.process({ clientId: "USER", message: { type: "ENGINE_GET_USER_PORTFOLIO", data: { userId: "2" } } });
        });

        // this will console log that order is not found
        await new Promise<void>(async (resolve) => {
            await sub.subscribe("TEST_INVALID_ORDER", async (msg) => {
                const parsedMessage: ApiEngineMessageType | Error = JSON.parse(msg);
                expect(parsedMessage.type).toEqual("Error");
                await sub.unsubscribe("TEST_INVALID_ORDER");
                resolve()
            });
            await engine.process({
                clientId: "TEST_INVALID_ORDER",
                message: {
                    type: "ENGINE_CANCEL_ORDER",
                    data: { market: "TATA_INR", orderId: orderId + 1, side: "buy", userId: "2" }
                }
            });
        });

        await new Promise<void>(async (resolve) => {
            await sub.subscribe("VALID_ORDER", async (msg) => {
                const parsedMessage: ApiEngineMessageType = JSON.parse(msg);

                if (beforeUser && parsedMessage.type === "API_USER_PORTFOLIO") {
                    const afterUser: UserInterface = parsedMessage.data.user;
                    expect(afterUser.lockedBalance).toEqual({});
                    expect(afterUser.balance["INR"]).toEqual(beforeUser.balance["INR"]! + 98);
                    await sub.unsubscribe("VALID_ORDER");
                    resolve();
                }
            });
            await engine.process({
                clientId: "VALID_ORDER",
                message: {
                    type: "ENGINE_CANCEL_ORDER",
                    data: { market: "TATA_INR", orderId: orderId, side: "buy", userId: "2" }
                }
            });
        });
    });

    afterEach(async () => {
        engine.removeMarket("TATA_INR");
        await pub.quit();
        await sub.quit();
    })
});