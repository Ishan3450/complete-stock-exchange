"use client"

import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOrderState } from "@/lib/common";
import { apiUrl } from "@repo/shared-types/portsAndUrl";
import { FrontendApiMessageType } from "@repo/shared-types/types";
import axios, { AxiosResponse } from "axios";
import { ChevronLeftIcon, Loader2Icon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";


export default function Order() {
    const router = useRouter();
    const { market, orderId } = useParams<{ market: string, orderId: string }>();
    const [baseAsset, quoteAsset] = market.split("_");
    const [loading, useLoading] = useState<boolean>(false);

    if (!baseAsset || !quoteAsset) {
        router.back();
        return <div className="p-5 text-red-400 text-3xl">
            Invalid Market Name
        </div>;
    }

    const [orderInfo, useOrderInfo] = useState<{
        price: number,
        quantity: number,
        side: "buy" | "sell",
        filled: number,
        isCancelled: boolean,
    }>({
        price: 0,
        quantity: 0,
        side: "buy",
        filled: 0,
        isCancelled: true
    });
    const [orderTrades, useOrderTrades] = useState<{
        price: number,
        timestamp: string,
        quantity: number,
        side: 'buy' | 'sell',
    }[]>([]);

    useEffect(() => {
        if (!market || !orderId) {
            toast.error("Market or order id not found.");
            router.back();
            return;
        }
        getOrderSummary();
    }, []);

    async function getOrderSummary() {
        const userId = localStorage.getItem("uid");

        if (!userId) {
            return toast.error("No user found !!");
        }

        const { data }: AxiosResponse<FrontendApiMessageType> = await axios.get(
            `${apiUrl}/order`,
            { params: { market, orderId, userId } }
        );

        if (data.type === "Error") {
            toast.error(data.errorMsg);
        } else if (data.type === "ORDER_SUMMARY") {
            useOrderInfo({
                price: Number(data.orderInfo.price),
                quantity: Number(data.orderInfo.quantity),
                side: data.orderInfo.side,
                filled: Number(data.orderInfo.filled),
                isCancelled: data.orderInfo.is_cancelled,
            });
            useOrderTrades(data.orderTrades);
        }
    }

    async function handleCancelOrder() {
        useLoading(true);
        const response: FrontendApiMessageType = await axios.delete(`${apiUrl}/order/cancel`, {
            data: {
                orderId,
                market,
                userId: localStorage.getItem("uid"),
                side: orderInfo.side
            }
        })

        useLoading(false);
        if (response.type === "Error") {
            toast.error(response.errorMsg);
        } else {
            router.back();
        }
    }

    return (
        <Container className="pt-10 pb-5 grid gap-5">
            <div className="flex justify-between items-center">
                <div className="text-4xl font-medium flex gap-3 items-center">
                    <span onClick={() => router.back()} className="hover:text-gray-500 cursor-pointer"><ChevronLeftIcon size={25} /></span>
                    <span>Order Summary</span>
                </div>
                {!orderInfo.isCancelled && orderInfo.quantity !== orderInfo.filled && (
                    loading ? (
                        <div className="flex gap-1 items-center p-3 border rounded-lg">
                            <Loader2Icon className="animate-spin" />
                            Cancelling your order
                        </div>
                    ) : (
                        <Button
                            variant={"outline"}
                            size={"lg"}
                            className="text-red-400 text-md border-red-200 hover:bg-red-400 hover:text-white cursor-pointer"
                            onClick={handleCancelOrder}
                        >
                            Cancel Order
                        </Button>
                    )
                )}
            </div>

            {/* Order Information */}
            <div className="flex gap-3">
                <OrderSummaryItem title="Order Id" value={orderId} />
                <OrderSummaryItem title="Price" value={`${orderInfo.price} ${quoteAsset}`} />
                <OrderSummaryItem title="Quantity" value={`${orderInfo.quantity} ${baseAsset}`} />
                <OrderSummaryItem title="Executed" value={`${orderInfo.filled} ${baseAsset}`} />
                <OrderSummaryItem title="Side" value={orderInfo.side} valueStyle={`${orderInfo.side === "buy" ? "text-green-500" : "text-red-400"} capitalize font-semibold`} />
                <OrderSummaryItem title="Order State" value={getOrderState(orderInfo)} />
            </div>

            {/* Trades */}
            <Table>
                <TableCaption>A list of trades matched with this order.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Price</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Quantity</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orderTrades.map((trade, idx) => {
                        return (
                            <TableRow key={idx}>
                                <TableCell>{trade.price}</TableCell>
                                <TableCell>{new Date(trade.timestamp).toLocaleString()}</TableCell>
                                <TableCell>{trade.quantity}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </Container>
    )
}

function OrderSummaryItem({ title, value, valueStyle = "" }: { title: string; value: any; valueStyle?: string }) {
    return (
        <div className="flex flex-col gap-1 px-4 py-2 border rounded-md bg-white shadow-sm w-full">
            <span className="text-xs text-gray-500">{title}</span>
            <span className={`font-semibold text-lg text-gray-800 ${valueStyle}`}>
                {value}
            </span>
        </div>
    );
}
