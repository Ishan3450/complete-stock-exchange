"use client"

import Container from "@/components/container";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiUrl } from "@repo/shared-types/portsAndUrl";
import { FrontendApiMessageType } from "@repo/shared-types/types";
import axios, { AxiosResponse } from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";


export default function Order() {
    const router = useRouter();
    const { market, orderId } = useParams<{ market: string, orderId: string }>();
    const [baseAsset, quoteAsset] = market.split("_");

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
    }>({
        price: 0,
        quantity: 0,
        side: "buy",
        filled: 0,
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
        const { data }: AxiosResponse<FrontendApiMessageType> = await axios.get(`
            ${apiUrl}/order?market=${market}&orderId=${orderId}
        `);

        if (data.type === "Error") {
            toast.error(data.errorMsg);
        } else if (data.type === "ORDER_SUMMARY") {
            useOrderInfo({
                price: Number(data.orderInfo.price),
                quantity: Number(data.orderInfo.quantity),
                side: data.orderInfo.side,
                filled: Number(data.orderInfo.filled),
            });
            useOrderTrades(data.orderTrades);
        }
    }

    return (
        <Container className="pt-10 pb-5 grid gap-5">
            <div className="text-4xl font-medium">
                Order Summary
            </div>

            {/* Order Information */}
            <div className="flex gap-3">
                <OrderSummaryItem title="Order Id" value={orderId} />
                <OrderSummaryItem title="Price" value={`${orderInfo.price} ${quoteAsset}`} />
                <OrderSummaryItem title="Quantity" value={`${orderInfo.quantity} ${baseAsset}`} />
                <OrderSummaryItem title="Executed" value={`${orderInfo.filled} ${baseAsset}`} />
                <OrderSummaryItem title="Side" value={orderInfo.side} valueStyle={`${orderInfo.side === "buy" ? "text-green-500" : "text-red-400"} capitalize font-semibold`} />
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
