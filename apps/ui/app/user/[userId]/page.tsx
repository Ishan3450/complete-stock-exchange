"use client";

import Container from "@/components/container";
import Orders from "@/components/orders";
import Portfolio from "@/components/portfolio";
import { apiUrl } from "@repo/shared-types/portsAndUrl";
import { FrontendApiMessageType, Order, UserInterface } from "@repo/shared-types/types";
import axios from "axios";
import { ChevronLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function UserProfile() {
    const router = useRouter();
    const { userId } = useParams<{ userId: string }>();
    const [userPortfolio, useUserPortfolio] = useState<UserInterface | null>(null);
    const [userOrders, useUserOrders] = useState<Omit<Order, 'userId'>[] | null>(null);

    useEffect(() => {
        axios.post(`${apiUrl}/portfolio/get`, {
            userId: userId
        }).then((res) => {
            const data: FrontendApiMessageType = res.data;

            if (data.type === "Error") {
                toast.error(data.errorMsg, { duration: 10000 });
            } else {
                useUserPortfolio(res.data.data?.user);
            }
        });

        axios.get(`${apiUrl}/order/all`, {
            params: { userId }
        }).then((res) => {
            const data: FrontendApiMessageType = res.data;

            if (data.type === "Error") {
                toast.error(data.errorMsg);
            } else if (data.type === "USER_ORDERS") {
                useUserOrders(data.data.orders);
            }
        });
    }, []);

    return (
        <Container className="pt-8">
            <div
                onClick={() => router.back()}
                className="flex gap-2 items-center mb-5 bg-gray-100 w-fit p-3 rounded-lg cursor-pointer hover:text-gray-500"
            >
                <ChevronLeftIcon size={25} />
                <span className="text-lg">Back</span>
            </div>
            <div className="flex justify-between">
                {userOrders && <Orders orders={userOrders} />}
                <Portfolio userPortfolio={userPortfolio} />
            </div>
        </Container>
    )
}