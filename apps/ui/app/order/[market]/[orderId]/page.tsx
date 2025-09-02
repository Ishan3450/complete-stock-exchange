"use client"

import Container from "@/components/container";
import { apiUrl } from "@repo/shared-types/portsAndUrl";
import { FrontendApiMessageType } from "@repo/shared-types/types";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";


export default function Order() {
    const router = useRouter();
    const { market, orderId } = useParams<{ market: string, orderId: string }>();
    const [orderInfo, useOrderInfo] = useState<{
        price: string,
        quantity: string,
        side: "buy" | "sell",
        filled: string,
    }>({
        price: "56.4",
        quantity: "2.54",
        side: "buy",
        filled: "1.23"
    });

    useEffect(() => {
        if (!market || !orderId) {
            toast.error("Market or order id not found.");
            router.back();
            return;
        }
        getOrderSummary();
    }, []);

    async function getOrderSummary() {
        const response: FrontendApiMessageType = await axios.get(`
            ${apiUrl}/order?market=${market}&orderId=${orderId}
        `);
        console.log(response);
    }

    return <Container className="py-5 grid gap-5">
        <div className="text-4xl">
            Order Summary
        </div>

        <div className="flex gap-3">
            <OrderSummaryItem title="Order Id" value={orderId} />
            <OrderSummaryItem title="Price" value={orderInfo.price} />
            <OrderSummaryItem title="Quantity" value={orderInfo.quantity} />
            <OrderSummaryItem title="Executed" value={orderInfo.filled} />
            <OrderSummaryItem title="Side" value={orderInfo.side} valueStyle={`${orderInfo.side === "buy" ? "text-green-500" : "text-red-400"} capitalize`} />
        </div>
    </Container>
}

function OrderSummaryItem({ title, value, valueStyle }: { title: string, value: string, valueStyle?: string }) {
    return <div className="grid gap-1 bg-gray-100 py-3 px-6 rounded-lg shadow w-full">
        <span className="text-gray-400">{title}</span>
        <span className={`text-3xl text-gray-700 ${valueStyle}`}>{value}</span>
    </div>
}