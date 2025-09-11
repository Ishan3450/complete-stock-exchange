import { Order } from "@repo/shared-types/types"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { getOrderState } from "@/lib/common";

type OrdersProps = {
    orders: Omit<Order, 'userId'>[];
}

export default function Orders({ orders }: OrdersProps) {
    const router = useRouter();

    return (
        <div className="w-full">
            <h2 className="text-xl font-semibold mb-4">Orders</h2>
            <Table>
                <TableCaption>A list your orders.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Sr. No.</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead>Filled</TableHead>
                        <TableHead>Base Asset</TableHead>
                        <TableHead>Quote Asset</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead>Order State</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order, idx) => {
                        return (
                            <TableRow key={idx}>
                                <TableCell>{idx}</TableCell>
                                <TableCell>{order.price}</TableCell>
                                <TableCell>{order.quantity}</TableCell>
                                <TableCell>{order.side}</TableCell>
                                <TableCell>{order.filled}</TableCell>
                                <TableCell>{order.base_asset}</TableCell>
                                <TableCell>{order.quote_asset}</TableCell>
                                <TableCell>
                                    <LinkIcon
                                        size={15}
                                        className="text-blue-500 cursor-pointer"
                                        onClick={() => (
                                            router.push(`/order/${order.base_asset}_${order.quote_asset}/${order.orderId}`)
                                        )}
                                    />
                                </TableCell>
                                <TableCell>{order.is_cancelled ? "Cancelled" : getOrderState(order)}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}