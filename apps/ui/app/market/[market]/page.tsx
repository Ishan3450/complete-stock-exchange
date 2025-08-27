"use client"

import OrderBookDepth from "@/components/order_book";
import Portfolio from "@/components/portfolio";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFormattedValue } from "@/lib/common";
import { getWebSocket } from "@/lib/websocket";
import { apiUrl } from "@repo/shared-types/portsAndUrl";
import { FrontendApiMessageType, UserInterface, WebsocketDatabaseMessageType, WebsocketEngineMessageType } from "@repo/shared-types/types";
import axios from "axios";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function MarketPage() {
    const { market } = useParams<{ market: string }>();
    const [side, useSide] = useState<'buy' | 'sell'>('buy');
    const ws = useRef<WebSocket | null>(null);
    const [openOrdersDepth, useOpenOrdersDepth] = useState<{
        bids: Record<number, number[]>,
        asks: Record<number, number[]>,
    }>({ bids: {}, asks: {} });
    const [tickerData, useTickerData] = useState<{
        open: number,
        high: number,
        low: number,
        close: number,
        volume: number,
    }>({
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0,
    });
    const [user, useUser] = useState<UserInterface | null>(null);

    useEffect(() => {
        if (!ws.current) {
            getWebSocket().then((wsRes) => {
                ws.current = wsRes;
                ws.current.send(JSON.stringify({
                    type: "SUBSCRIBE",
                    data: {
                        subscriptionName: market
                    }
                }));

                ws.current.onmessage = (message) => {
                    const data: WebsocketEngineMessageType | WebsocketDatabaseMessageType = JSON.parse(message.data);

                    if (data.type === "WS_DEPTH") {
                        useOpenOrdersDepth({
                            bids: data.data.bids,
                            asks: data.data.asks,
                        })
                    }
                    if (data.type === "WS_TICKER_UPDATE") {
                        useTickerData({
                            open: data.data.open,
                            high: data.data.high,
                            low: data.data.low,
                            close: data.data.close,
                            volume: data.data.volume,
                        });
                    }
                }
            });
        }

        axios.get(`${apiUrl}/ticker/get?market=${market}`).then((res) => {
            const response: FrontendApiMessageType = res.data;
            if (response.type === "TICKER" && response.success) {
                useTickerData(response.data!);
            }
        });
        axios.get(`${apiUrl}/depth/get?market=${market}`).then((res) => {
            useOpenOrdersDepth(res.data.data);
        });
        axios.post(`${apiUrl}/portfolio/get`, {
            userId: localStorage.getItem("uid")
        }).then((res) => {
            useUser(res.data.data.user);
        });

    }, []);

    const splitted = market.split("_");
    return (
        <div className="p-3 flex bg-gray-50 h-screen gap-3">
            <div className="w-[70%] flex flex-col gap-3">
                {/* Market name and ticker information */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <Link href={"/"} className="text-gray-500 cursor-pointer p-2">
                            <ChevronLeft size={25} />
                        </Link>
                        <CardTitle className="text-2xl w-[40%]">
                            <span>{splitted[0]}</span>
                            <span className="text-gray-400"> ({splitted[1]})</span>
                        </CardTitle>
                        <div className="flex justify-between mt-4 w-full">
                            {/* Last Price */}
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-500">Last Trade Price</span>
                                <span className="text-lg font-semibold text-green-600">
                                    {getFormattedValue(tickerData.close)} {splitted[1]}
                                </span>
                            </div>

                            {/* 24h High */}
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-500">24h High</span>
                                <span className="text-lg font-semibold text-green-600">{getFormattedValue(tickerData.high)} {splitted[1]}</span>
                            </div>

                            {/* 24h Low */}
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-500">24h Low</span>
                                <span className="text-lg font-semibold text-red-400">{getFormattedValue(tickerData.low)} {splitted[1]}</span>
                            </div>

                            {/* 24h Volume */}
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-500">
                                    24h Volume ({splitted[0]})
                                </span>
                                <span className="text-lg font-semibold">{getFormattedValue(tickerData.volume)} {splitted[0]}</span>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
                <Card className="p-5 h-full overflow-scroll">
                    <Tabs defaultValue="account">
                        <TabsList className="py-5 px-1">
                            <TabsTrigger className="p-4" value="chart">Chart</TabsTrigger>
                            <TabsTrigger className="p-4" value="trades">Trades</TabsTrigger>
                            <TabsTrigger className="p-4" value="book">Book</TabsTrigger>
                            <TabsTrigger className="p-4" value="portfolio">Portfolio</TabsTrigger>
                        </TabsList>
                        <TabsContent value="chart">Chart</TabsContent>
                        <TabsContent value="trades">Trades</TabsContent>
                        <TabsContent value="book">
                            <OrderBookDepth assets={splitted} openOrdersDepth={openOrdersDepth} />
                        </TabsContent>
                        <TabsContent value="portfolio">
                            <Portfolio userPortfolio={user} />
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
            <Card className="w-[30%] p-5">
                {/* Buy and Sell Tabs */}
                <div className="bg-gray-100 flex justify-between rounded-lg cursor-pointer font-semibold">
                    <span
                        className={`px-4 py-5 rounded-lg text-center w-full hover:text-green-500 ${side === 'buy' ? 'bg-green-200 text-green-500' : ''}`}
                        onClick={() => useSide("buy")}
                    >
                        Buy
                    </span>
                    <span
                        className={`px-4 py-5 rounded-lg text-center w-full hover:text-red-400 ${side === 'sell' ? 'bg-red-200 text-red-400' : ''}`}
                        onClick={() => useSide("sell")}
                    >
                        Sell
                    </span>
                </div>

                {/* if buy then max quoteAsset a user can spend on this market
                  * if sell then max baseAsset a user can dilute on this market
                 */}
                <div className="text-gray-400 flex justify-between">
                    <span>Balance</span>
                    <span>- {side === "sell" ? splitted[0] : splitted[1]}</span>
                </div>

                <div className="grid gap-1 w-full items-center text-xl">
                    <span className="text-gray-400">Price</span>
                    <Input id="picture" type="text" />
                </div>
                <div className="grid gap-1 w-full items-center text-xl">
                    <span className="text-gray-400">Quantity</span>
                    <Input id="picture" type="text" />
                </div>

                {/* Total order value */}
                <div className="grid gap-1 w-full items-center text-xl">
                    <span className="text-gray-400">Order Value</span>
                    <span className="border text-gray-600 p-3 rounded-lg">
                        500 {side === "buy" ? splitted[1] : splitted[0]}
                    </span>
                </div>

                {/* Do trade button */}
                <Button
                    variant={"secondary"}
                    className="h-12 text-xl bg-gray-200 text-gray-600 cursor-pointer mt-5">
                    Trade
                </Button>
            </Card>
        </div>
    );
}
