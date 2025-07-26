import { Order } from "@repo/shared-types/src";
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
        market.addOrder({
            price: 100,
            quantity: 2,
            side: "sell",
            userId: "user1",
            orderId: 1,
            filled: 0,
        });
        market.addOrder({
            price: 103,
            quantity: 5,
            side: "sell",
            userId: "user2",
            orderId: 2,
            filled: 0,
        })

        const buyOrder1 = {
            price: 103,
            quantity: 5,
            side: "buy",
            userId: "user2",
            orderId: 2,
            filled: 0,            
        };
        const buyOrder2 = {
            price: 103,
            quantity: 5,
            side: "buy",
            userId: "user2",
            orderId: 2,
            filled: 0,
        }
    });

    test("Test sell order matching", () => {

    });
});