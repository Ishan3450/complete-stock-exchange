import { Order } from "@repo/shared-types/types";
import { OrderBook } from "../OrderBook";

describe("OrderBook Tests", () => {
    let market: OrderBook;

    beforeEach(() => {
        market = new OrderBook("TATA", "INR");
    })

    test("Test add order in fresh market", () => {
        const buyOrder: Order = {
            price: 100,
            quantity: 2,
            side: "buy",
            userId: "user1",
            orderId: 1,
            filled: 0,
        }
        const sellOrder: Order = {
            price: 102,
            quantity: 5,
            side: "sell",
            userId: "user2",
            orderId: 2,
            filled: 0,
        }

        expect(market.addOrder(buyOrder)).toStrictEqual({
            executedQuantity: 0,
            fills: []
        });
        expect(market.addOrder(sellOrder)).toStrictEqual({
            executedQuantity: 0,
            fills: []
        });
    });

    test("Test add back to back buy orders", () => {
        const buyOrder1: Order = {
            price: 100,
            quantity: 2,
            side: "buy",
            userId: "user1",
            orderId: 1,
            filled: 0,
        }
        const buyOrder2: Order = {
            price: 103,
            quantity: 5,
            side: "buy",
            userId: "user2",
            orderId: 2,
            filled: 0,
        }

        expect(market.addOrder(buyOrder1)).toStrictEqual({
            executedQuantity: 0,
            fills: []
        });
        expect(market.addOrder(buyOrder2)).toStrictEqual({
            executedQuantity: 0,
            fills: []
        });
    });

    test("Test add back to back sell orders", () => {
        const sellOrder1: Order = {
            price: 100,
            quantity: 2,
            side: "sell",
            userId: "user1",
            orderId: 1,
            filled: 0,
        }
        const sellOrder2: Order = {
            price: 103,
            quantity: 5,
            side: "sell",
            userId: "user2",
            orderId: 2,
            filled: 0,
        }

        expect(market.addOrder(sellOrder1)).toStrictEqual({
            executedQuantity: 0,
            fills: []
        });
        expect(market.addOrder(sellOrder2)).toStrictEqual({
            executedQuantity: 0,
            fills: []
        });
    });

    test("Test buy order matching", () => {
        // adding sell order to be matched with the buy order
        const sellOrder1: Order = {
            price: 100,
            quantity: 2,
            side: "sell",
            userId: "user1",
            orderId: 1,
            filled: 0,
        };
        const sellOrder2: Order = {
            price: 103,
            quantity: 5,
            side: "sell",
            userId: "user2",
            orderId: 2,
            filled: 0,
        };
        market.addOrder(sellOrder1);
        market.addOrder(sellOrder2);

        const buyOrder1: Order = {
            price: 103,
            quantity: 1,
            side: "buy",
            userId: "user3",
            orderId: 3,
            filled: 0,
        };
        const buyOrder1Result = market.addOrder(buyOrder1);
        expect(buyOrder1Result).toStrictEqual({
            executedQuantity: 1,
            fills: [{
                price: 100,
                quantity: 1,
                fillOwnerId: "user1",
                tradeId: 1,
                marketOrderId: 1,
            }]
        });
        expect(buyOrder1.filled).toEqual(1);
        expect(sellOrder1.filled).toEqual(1);

        const buyOrder2: Order = {
            price: 103,
            quantity: 3,
            side: "buy",
            userId: "user4",
            orderId: 4,
            filled: 0,
        }
        const buyOrder2Result = market.addOrder(buyOrder2);
        expect(buyOrder2Result).toStrictEqual({
            executedQuantity: 3,
            fills: [{
                price: 100,
                quantity: 1,
                fillOwnerId: "user1",
                tradeId: 2,
                marketOrderId: 1,
            }, {
                price: 103,
                quantity: 2,
                fillOwnerId: "user2",
                tradeId: 3,
                marketOrderId: 2,
            }]
        });
        expect(buyOrder2.filled).toEqual(3);
        expect(sellOrder1.filled).toEqual(2);
        expect(sellOrder2.filled).toEqual(2);
    });

    test("Test sell order matching", () => {
        // adding buy orders to be matched with the sell order
        const buyOrder1: Order = {
            price: 105,
            quantity: 2,
            side: "buy",
            userId: "user1",
            orderId: 1,
            filled: 0,
        };
        const buyOrder2: Order = {
            price: 103,
            quantity: 5,
            side: "buy",
            userId: "user2",
            orderId: 2,
            filled: 0,
        };
        market.addOrder(buyOrder1);
        market.addOrder(buyOrder2);

        const sellOrder1: Order = {
            price: 103,
            quantity: 1,
            side: "sell",
            userId: "user3",
            orderId: 3,
            filled: 0,
        };
        const sellOrder1Result = market.addOrder(sellOrder1);
        expect(sellOrder1Result).toStrictEqual({
            executedQuantity: 1,
            fills: [{
                price: 105,
                quantity: 1,
                fillOwnerId: "user1",
                tradeId: 1,
                marketOrderId: 1,
            }]
        });
        expect(sellOrder1.filled).toEqual(1);
        expect(buyOrder1.filled).toEqual(1);

        const sellOrder2: Order = {
            price: 103,
            quantity: 3,
            side: "sell",
            userId: "user4",
            orderId: 4,
            filled: 0,
        };
        const sellOrder2Result = market.addOrder(sellOrder2);
        expect(sellOrder2Result).toStrictEqual({
            executedQuantity: 3,
            fills: [{
                price: 105,
                quantity: 1,
                fillOwnerId: "user1",
                tradeId: 2,
                marketOrderId: 1,
            }, {
                price: 103,
                quantity: 2,
                fillOwnerId: "user2",
                tradeId: 3,
                marketOrderId: 2,
            }]
        });
        expect(sellOrder2.filled).toEqual(3);
        expect(buyOrder1.filled).toEqual(2);
        expect(buyOrder2.filled).toEqual(2);
    });

    test("Test same owner order matching", () => {
        const buyOrder1: Order = {
            price: 105,
            quantity: 2,
            side: "buy",
            userId: "user1",
            orderId: 1,
            filled: 0,
        };
        const sellOrder1: Order = {
            price: 103,
            quantity: 1,
            side: "sell",
            userId: "user1",
            orderId: 3,
            filled: 0,
        };
        market.addOrder(sellOrder1);

        expect(market.addOrder(buyOrder1)).toStrictEqual({
            executedQuantity: 0,
            fills: []
        });
    });

    test("Test order buy price less than sell price must not match", () => {
        const buyOrder1: Order = {
            price: 105,
            quantity: 2,
            side: "buy",
            userId: "user1",
            orderId: 1,
            filled: 0,
        };
        const sellOrder1: Order = {
            price: 110,
            quantity: 1,
            side: "sell",
            userId: "user1",
            orderId: 3,
            filled: 0,
        };
        market.addOrder(sellOrder1);
        expect(market.addOrder(buyOrder1)).toStrictEqual({
            executedQuantity: 0,
            fills: []
        });
    });

    test("Test order sell price more than buy price must not match", () => {
        const buyOrder1: Order = {
            price: 105,
            quantity: 2,
            side: "buy",
            userId: "user1",
            orderId: 1,
            filled: 0,
        };
        const sellOrder1: Order = {
            price: 110,
            quantity: 1,
            side: "sell",
            userId: "user1",
            orderId: 3,
            filled: 0,
        };
        market.addOrder(buyOrder1);
        expect(market.addOrder(sellOrder1)).toStrictEqual({
            executedQuantity: 0,
            fills: []
        });
    });

    test("Test cancel order", () => {
        const buyOrder: Order = {
            price: 105,
            quantity: 2,
            side: "buy",
            userId: "user1",
            orderId: 1,
            filled: 0,
        };
        const sellOrder: Order = {
            price: 110,
            quantity: 1,
            side: "sell",
            userId: "user1",
            orderId: 3,
            filled: 0,
        };

        expect(market.cancelOrder(2, "buy")).toEqual(false);
        expect(market.cancelOrder(2, "sell")).toEqual(false);

        // testing cancel on empty market
        market.addOrder(buyOrder);
        market.addOrder(sellOrder);

        // testing sell order id with buy side
        expect(market.cancelOrder(3, "buy")).toEqual(false);

        // testing buy order id with sell side
        expect(market.cancelOrder(1, "sell")).toEqual(false);

        expect(market.cancelOrder(1, "buy")).toStrictEqual(buyOrder);
        expect(market.cancelOrder(3, "sell")).toStrictEqual(sellOrder);
    });

    test("Test get depth", () => {
        const buyOrder1: Order = {
            price: 105,
            quantity: 2,
            side: "buy",
            userId: "user1",
            orderId: 1,
            filled: 0,
        };
        const buyOrder2: Order = {
            price: 103,
            quantity: 5,
            side: "buy",
            userId: "user2",
            orderId: 2,
            filled: 0,
        };
        const buyOrder3: Order = {
            price: 105,
            quantity: 5,
            side: "buy",
            userId: "user2",
            orderId: 6,
            filled: 0,
        };
        const sellOrder1: Order = {
            price: 110,
            quantity: 1,
            side: "sell",
            userId: "user3",
            orderId: 3,
            filled: 0,
        };
        const sellOrder2: Order = {
            price: 112,
            quantity: 4,
            side: "sell",
            userId: "user4",
            orderId: 4,
            filled: 0,
        };
        const sellOrder3: Order = {
            price: 110,
            quantity: 4,
            side: "sell",
            userId: "user4",
            orderId: 5,
            filled: 0,
        };

        market.addOrder(buyOrder1);
        market.addOrder(buyOrder2);
        market.addOrder(buyOrder3);
        market.addOrder(sellOrder1);
        market.addOrder(sellOrder2);
        market.addOrder(sellOrder3);

        expect(market.getDepth()).toStrictEqual({
            bids: {
                105: 2,
                103: 1
            },
            asks: {
                110: 2,
                112: 1
            }
        });
    });

    test("Test get open orders of user", () => {
        const buyOrder1: Order = {
            price: 105,
            quantity: 2,
            side: "buy",
            userId: "user1",
            orderId: 1,
            filled: 0,
        };
        const buyOrder2: Order = {
            price: 103,
            quantity: 5,
            side: "buy",
            userId: "user2",
            orderId: 2,
            filled: 0,
        };
        const buyOrder3: Order = {
            price: 106,
            quantity: 3,
            side: "buy",
            userId: "user2",
            orderId: 6,
            filled: 0,
        };
        const sellOrder1: Order = {
            price: 110,
            quantity: 1,
            side: "sell",
            userId: "user3",
            orderId: 3,
            filled: 0,
        };
        const sellOrder2: Order = {
            price: 112,
            quantity: 4,
            side: "sell",
            userId: "user4",
            orderId: 4,
            filled: 0,
        };
        const sellOrder3: Order = {
            price: 111,
            quantity: 2,
            side: "sell",
            userId: "user2",
            orderId: 5,
            filled: 0,
        };

        market.addOrder(buyOrder1);
        market.addOrder(buyOrder2);
        market.addOrder(buyOrder3);
        market.addOrder(sellOrder1);
        market.addOrder(sellOrder2);
        market.addOrder(sellOrder3);

        const user2Orders = market.getUserOpenOrders("user2");
        expect(user2Orders.bids).toEqual(expect.arrayContaining([buyOrder2, buyOrder3]));
        expect(user2Orders.asks).toEqual(expect.arrayContaining([sellOrder3]));

        const user4Orders = market.getUserOpenOrders("user4");
        expect(user4Orders.bids).toEqual(expect.arrayContaining([]));
        expect(user4Orders.asks).toEqual(expect.arrayContaining([sellOrder2]));
    })
});