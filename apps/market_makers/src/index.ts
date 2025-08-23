import { redisUrl } from "@repo/shared-types/portsAndUrl";
import { MarketMakerEngineMessageType } from "@repo/shared-types/types";
import { createClient } from "redis";

const MAX_ALLOWED = 15;
const USER_ID = "99999";
const redisClient = createClient({ url: redisUrl });
const sub = createClient({ url: redisUrl });

async function init() {
    await redisClient.connect();
    await sub.connect();

    await redisClient.lPush("engineMessages", JSON.stringify({
        clientId: "_",
        message: {
            type: "ENGINE_CREATE_USER",
            data: {
                userId: USER_ID,
                userName: "Market Maker",
                userPassword: "liquidater :)"
            }
        }
    }));

    main();
}

async function main() {
    await sub.subscribe("GET_MARKETS_WITH_OPEN_ORDERS_COUNT", (response) => {
        const parsedData: MarketMakerEngineMessageType = JSON.parse(response);
        console.log(parsedData);

        parsedData.data.forEach(async (marketStat) => {
            if (marketStat.totalAsks < MAX_ALLOWED) {
                let asksToAdd = MAX_ALLOWED - marketStat.totalAsks;

                while (asksToAdd > 0) {
                    await _addBid(marketStat.market);
                    asksToAdd--;
                }
            }
            if (marketStat.totalBids < MAX_ALLOWED) {
                let bidsToAdd = MAX_ALLOWED - marketStat.totalBids;

                while (bidsToAdd > 0) {
                    await _addAsk(marketStat.market);
                    bidsToAdd--;
                }

            }
        })
    });

    await redisClient.lPush("engineMessages", JSON.stringify({
        clientId: "GET_MARKETS_WITH_OPEN_ORDERS_COUNT",
        message: {
            type: "ENGINE_MARKET_STATS"
        }
    }))
}

async function _addBid(marketName: string) {
    const assets = marketName.split("_");

    // first decide amount and quantity
    const amount = Math.floor(Math.random() * 100);
    const quantity = Math.floor(Math.random() * 10);

    // onramp balance in user's account
    await redisClient.lPush("engineMessages", JSON.stringify({
        clientId: "_",
        message: {
            type: "ENGINE_ADD_BALANCE",
            data: {
                userId: USER_ID,
                currency: assets[1],
                amount: amount * quantity,
            }
        }
    }));

    // add bid
    await redisClient.lPush("engineMessages", JSON.stringify({
        clientId: "_",
        message: {
            type: "ENGINE_CREATE_ORDER",
            data: { market: marketName, price: amount, quantity: quantity, side: "buy", userId: USER_ID }
        }
    }));
}

async function _addAsk(marketName: string) {
    const assets = marketName.split("_");

    // first decide quantity
    const quantity = Math.floor(Math.random() * 10);

    // onramp holdings in user's account
    await redisClient.lPush("engineMessages", JSON.stringify({
        clientId: "_",
        message: {
            type: "ENGINE_ADD_HOLDINGS",
            data: {
                userId: USER_ID,
                baseAsset: assets[0],
                quantity: quantity,
            }
        }
    }));

    // add bid
    await redisClient.lPush("engineMessages", JSON.stringify({
        clientId: "_",
        message: {
            type: "ENGINE_CREATE_ORDER",
            data: { market: marketName, price: Math.floor(Math.random() * 100), quantity: quantity, side: "sell", userId: USER_ID }
        }
    }));
}

init();

setInterval(main, 5000);