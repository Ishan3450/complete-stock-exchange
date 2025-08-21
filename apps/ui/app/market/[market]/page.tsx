"use client"

import OrderBook from "@/components/order_book";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function MarketPage() {
    const { market } = useParams<{ market: string }>();
    const [side, useSide] = useState<'buy' | 'sell'>('buy');

    useEffect(() => {

    }, []);

    const splitted = market.split("_");
    return (
        <div className="p-3 flex bg-gray-50 h-screen gap-3">
            <div className="w-[70%] flex flex-col gap-3">
                {/* Market name and ticker information */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="text-2xl w-[40%]">
                            <span>{splitted[0]}</span>
                            <span className="text-gray-400"> ({splitted[1]})</span>
                        </CardTitle>
                        <div className="flex justify-between mt-4 w-full">
                            {/* Last Price */}
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-500">Last Trade Price</span>
                                <span className="text-lg font-semibold text-green-500">
                                    254 {splitted[1]}
                                </span>
                            </div>

                            {/* 24h High */}
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-500">24h High</span>
                                <span className="text-lg font-semibold text-green-400">312 {splitted[1]}</span>
                            </div>

                            {/* 24h Low */}
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-500">24h Low</span>
                                <span className="text-lg font-semibold text-red-400">126 {splitted[1]}</span>
                            </div>

                            {/* 24h Volume */}
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-500">
                                    24h Volume ({splitted[1]})
                                </span>
                                <span className="text-lg font-semibold">501123 {splitted[1]}</span>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
                <Card className="p-5 h-full">
                    <Tabs defaultValue="account" className="w-[400px]">
                        <TabsList className="py-5 px-1">
                            <TabsTrigger className="p-4" value="chart">Chart</TabsTrigger>
                            <TabsTrigger className="p-4" value="trades">Trades</TabsTrigger>
                            <TabsTrigger className="p-4" value="book">Book</TabsTrigger>
                        </TabsList>
                        <TabsContent value="chart">Chart</TabsContent>
                        <TabsContent value="trades">Trades</TabsContent>
                        <TabsContent value="book"><OrderBook market={market}/></TabsContent>
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
