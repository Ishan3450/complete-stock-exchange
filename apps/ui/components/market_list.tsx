import { useEffect, useState } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";
import { apiUrl } from "@repo/shared-types/portsAndUrl";
import { useRouter } from "next/navigation";
import { UserIcon } from "lucide-react";


/**
 * TODO: Get the ticker values also with the markets list to display
 * in the market list.
 */

export default function MarketList() {
    const [markets, useMarkets] = useState<string[]>([]);
    const router = useRouter();
    const [userId, useUserId] = useState<string | null>(null);

    useEffect(() => {
        const uid = localStorage.getItem("uid");

        if (!uid) {
            router.push("/signin");
            return;
        }
        useUserId(uid);

        async function getMarkets() {
            const { data }: { data: { markets: string[] } } = await axios.get(`${apiUrl}/markets`);
            useMarkets(data.markets);
        }
        getMarkets();
    }, []);

    return <div className="grid gap-2">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl">Markets</h2>
            <div
                className="text-lg cursor-pointer flex gap-1 hover:underline hover:text-blue-500"
                onClick={() => router.push(`/user/${userId}`)}
            >
                <UserIcon />
                Profile
            </div>
        </div>


        <Table>
            <TableCaption>A list of available markets.</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Name</TableHead>
                    <TableHead>Currency</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {markets.map((market, idx) => {
                    const splitted = market.split("_");
                    return (
                        <TableRow
                            key={idx}
                            className="cursor-pointer"
                            onClick={() => router.push(`market/${market}`)}
                        >
                            <TableCell className="font-medium">{splitted[0]}</TableCell>
                            <TableCell>{splitted[1]}</TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    </div>
}
