"use client"

import Chart from "@/components/chart";
import OrderBookDepth from "@/components/order_book";
import Portfolio from "@/components/portfolio";
import { Trades } from "@/components/trades";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getFormattedValue } from "@/lib/common";
import { getWebSocket } from "@/lib/websocket";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { apiUrl } from "@repo/shared-types/portsAndUrl";
import {
    ApiEngineMessageType,
    FrontendApiMessageType,
    Trade,
    UserInterface,
    WebsocketDatabaseMessageType,
    WebsocketEngineMessageType
} from "@repo/shared-types/types";
import axios, { AxiosResponse } from "axios";
import { ChartColumnStackedIcon, ChevronDown, ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CandlestickData, Time, UTCTimestamp } from "lightweight-charts";


export default function MarketPage() {
    const router = useRouter();
    const { market } = useParams<{ market: string }>();
    const [tabName, useTabName] = useState<"chart" | "trades" | "orderbook" | "portfolio">("chart");
    const [chartTimeBucket, useChartTimeBucket] = useState<'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'>('day');
    const [side, useSide] = useState<'buy' | 'sell'>('buy');
    const ws = useRef<WebSocket | null>(null);
    const userId = useRef<string | null>(null);
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
    const [price, usePrice] = useState<string>("");
    const [quantity, useQuantity] = useState<string>("");
    const [loading, useLoading] = useState<boolean>(false);
    const [trades, useTrades] = useState<Trade[]>([]);
    const [chartData, useChartData] = useState<CandlestickData<Time>[]>([]);
    const chartTimeBucketRef = useRef(chartTimeBucket);

    useEffect(() => {
        const uid = localStorage.getItem("uid");
        if (!uid) {
            router.push("/signin")
            toast.warning("Unauthorized access !!");
            return;
        }
        userId.current = uid;
        if (!ws.current) {
            getWebSocket().then((wsRes) => {
                ws.current = wsRes;
                ws.current.send(JSON.stringify({
                    type: "SUBSCRIBE",
                    data: {
                        subscriptionName: `${market}_TRADES`
                    }
                }));
                ws.current?.send(JSON.stringify({
                    type: "SUBSCRIBE",
                    data: {
                        subscriptionName: `${market}_TRADES_${chartTimeBucket}`.toUpperCase()
                    }
                }))

                ws.current.onmessage = (message) => {
                    const data: WebsocketEngineMessageType | WebsocketDatabaseMessageType = JSON.parse(message.data);

                    if (data.type === "WS_DEPTH") {
                        useOpenOrdersDepth({
                            bids: data.data.bids,
                            asks: data.data.asks,
                        })
                        getMarketTrades();
                    }
                    if (data.type === "WS_TICKER_UPDATE" && data.data.market.toLowerCase() === market.toLowerCase()) {
                        useTickerData({
                            open: data.data.open,
                            high: data.data.high,
                            low: data.data.low,
                            close: data.data.close,
                            volume: data.data.volume,
                        });
                    }

                    if (
                        data.type === "WS_OHLCV_DATA" &&
                        data.data.bucket.toLowerCase() === chartTimeBucketRef.current.toLowerCase() &&
                        data.data.market.toLowerCase() === market.toLowerCase()
                    ) {
                        useChartData(data.data.lines.map((line) => ({
                            open: Number(line.open),
                            close: Number(line.close),
                            high: Number(line.high),
                            low: Number(line.low),
                            time: Math.floor(new Date(line.time).getTime() / 1000) as UTCTimestamp, // .getTime returns milliseconds so dividing by 1000 to get unix epoch timestamp
                        })));
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
        getUserPortfolio();
        getMarketTrades();

        return () => {
            ws.current?.send(JSON.stringify({
                type: "UNSUBSCRIBE",
                data: {
                    subscriptionName: `${market}_TRADES_${chartTimeBucketRef.current}`.toUpperCase()
                }
            }));
        }
    }, []);

    useEffect(() => {
        axios.get(`${apiUrl}/klines`, {
            params: {
                market: market,
                timeBucket: chartTimeBucket,
            }
        }).then((res) => {
            const data: FrontendApiMessageType = res.data;

            if (data.type === "Error") {
                toast.error(data.errorMsg);
            } else if (data.type === "OHLCV_LINES") {
                useChartData(data.data.lines.map((line) => ({
                    open: Number(line.open),
                    close: Number(line.close),
                    high: Number(line.high),
                    low: Number(line.low),
                    time: Math.floor(new Date(line.time).getTime() / 1000) as UTCTimestamp, // .getTime returns milliseconds so dividing by 1000 to get unix epoch timestamp
                })));
            }
        });
    }, [chartTimeBucket]);

    function getUserPortfolio() {
        axios.post(`${apiUrl}/portfolio/get`, {
            userId: userId.current
        }).then((res) => {
            useUser(res.data.data?.user);
        });
    }
    async function getMarketTrades() {
        const response = await axios.get(`${apiUrl}/trades/get?market=${market}`);
        useTrades(response.data);
    }

    async function handleAddOrder() {
        useLoading(true);
        if (!areInputsValid()) {
            return;
        }
        const formattedPrice = Number(price);
        const formattedQuantity = Number(quantity);
        let toGetUpdatedPortfolio: boolean = true;

        // quantity, price, market, side, userId
        const { data }: AxiosResponse<ApiEngineMessageType | FrontendApiMessageType> = await axios.post(`${apiUrl}/order/add`, {
            quantity: formattedQuantity,
            price: formattedPrice,
            market: market,
            side: side,
            userId: userId.current
        });

        if (data.type === "Error") {
            toast.error(data.errorMsg);
            useLoading(false);
            return;
        }
        if (data.type === "API_ORDER_PLACED" && data.data.executedQuantity > 0) {
            toGetUpdatedPortfolio = false;
            router.push(`/order/${market}/${data.data.orderId}`);
        }
        toast.success("Order added successfully !!")

        if (toGetUpdatedPortfolio) getUserPortfolio();
        useLoading(false);
    }

    function areInputsValid() {
        return !isNaN(Number(price)) && !isNaN(Number(quantity)) && price !== "" && quantity !== "";
    }

    function handleChartTimeBucketOnChange(value: string) {
        useChartTimeBucket((prev) => {
            // unsubscribe to old subscription to stop receiving that updates
            ws.current?.send(JSON.stringify({
                type: "UNSUBSCRIBE",
                data: {
                    subscriptionName: `${market}_TRADES_${prev}`.toUpperCase()
                }
            }))

            // subscribe to new subscription to start receiving that updates
            ws.current?.send(JSON.stringify({
                type: "SUBSCRIBE",
                data: {
                    subscriptionName: `${market}_TRADES_${value}`.toUpperCase()
                }
            }))

            const newValue = value as ("minute" | "hour" | "day" | "week" | "month" | "year");
            chartTimeBucketRef.current = newValue;
            return newValue;
        });
    }

    const splitted = market.split("_");
    return (
        <div className="p-3 flex bg-gray-50 h-screen gap-3">
            <div className="w-[70%] flex flex-col gap-3">
                {/* Market name and ticker information */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <Link href={"/"} className="text-gray-500 cursor-pointer p-2">
                            <ChevronLeftIcon size={25} />
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
                    <div className="h-full">
                        <div className="flex gap-3 mb-5">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size={"lg"} className="capitalize"><ChevronDown /> {tabName}</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>View</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup
                                        value={tabName}
                                        onValueChange={(value: string) => {
                                            useTabName(value as ("chart" | "trades" | "orderbook" | "portfolio"));
                                        }}>
                                        <DropdownMenuRadioItem value="chart">Chart</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="trades">Trades</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="orderbook">Orderbook</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="portfolio">Portfolio</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* time buckets for chart */}
                            {tabName === "chart" && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size={"lg"} className="capitalize"><ChartColumnStackedIcon size={40} />{chartTimeBucket}</Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        <DropdownMenuLabel>Chart Data Bucket</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuRadioGroup
                                            value={chartTimeBucket}
                                            onValueChange={handleChartTimeBucketOnChange}>
                                            <DropdownMenuRadioItem value="minute">Minute</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="hour">Hour</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="day">Day</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="week">Week</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="month">Month</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="year">Year</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                        {tabName === "chart" && <Chart chartData={chartData} />}
                        {tabName === "trades" && <Trades trades={trades} assets={splitted} />}
                        {tabName === "orderbook" && <OrderBookDepth assets={splitted} openOrdersDepth={openOrdersDepth} />}
                        {tabName === "portfolio" && (
                            <>
                                {user && <Portfolio userPortfolio={user} />}
                                {!user && (
                                    <div className="p-5 text-lg bg-gray-100 my-2 rounded-lg">
                                        Please{" "}
                                        <Link href={"/signin"} className="text-blue-500 hover:underline">signin</Link>{" "}
                                        or{" "}
                                        <Link href={"/signup"} className="text-blue-500 hover:underline">signup</Link>{" "}
                                        to see your portfolio.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Card>
            </div>
            <Card className="w-[30%] p-5">
                {/* Buy and Sell Tabs */}
                <div className="bg-gray-100 flex justify-between rounded-lg cursor-pointer font-semibold">
                    <span
                        className={`px-4 py-5 rounded-lg text-center w-full hover:text-green-500 ${side === 'buy' ? 'bg-green-200 text-green-500' : ''}`}
                        onClick={() => !loading && useSide("buy")}
                    >
                        Buy
                    </span>
                    <span
                        className={`px-4 py-5 rounded-lg text-center w-full hover:text-red-400 ${side === 'sell' ? 'bg-red-200 text-red-400' : ''}`}
                        onClick={() => !loading && useSide("sell")}
                    >
                        Sell
                    </span>
                </div>

                {/* if buy then max quoteAsset a user can spend on this market
                  * if sell then max baseAsset a user can dilute on this market
                 */}
                <div className="text-gray-400 flex justify-between">
                    <span>Balance</span>
                    <span>
                        {side === "sell" ? (
                            `${getFormattedValue(user?.holdings[splitted[0]] ?? 0)} ${splitted[0]}`
                        ) : (
                            `${getFormattedValue(user?.balance[splitted[1]] ?? 0)} ${splitted[1]}`
                        )}
                    </span>
                </div>

                <div className="grid gap-1 w-full items-center text-xl">
                    <span className="text-gray-400">Price</span>
                    <Input
                        id="price"
                        type="text"
                        value={price}
                        onChange={(e) => usePrice(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className="grid gap-1 w-full items-center text-xl">
                    <span className="text-gray-400">Quantity</span>
                    <Input
                        id="quantity"
                        type="text"
                        value={quantity}
                        onChange={(e) => useQuantity(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {/* Total order value */}
                <div className="grid gap-1 w-full items-center text-xl">
                    <span className="text-gray-400">Order Value</span>
                    <span className="border text-gray-600 p-3 rounded-lg">
                        {areInputsValid()
                            ? `${(parseFloat(Number(price).toFixed(2)) * parseFloat(Number(quantity).toFixed(2))).toFixed(2)} ${splitted[1]}`
                            : ""}
                    </span>
                </div>

                {/* Do trade button */}
                <Button
                    className="h-12 text-xl cursor-pointer mt-5"
                    disabled={!user || !areInputsValid() || loading}
                    onClick={handleAddOrder}
                >
                    {
                        user ? "Trade" : "Signin or signup to trade"
                    }
                </Button>
            </Card>
        </div>
    );
}
