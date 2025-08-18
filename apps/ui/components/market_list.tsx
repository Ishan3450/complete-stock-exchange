import { useEffect, useState } from "react";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";
import { apiUrl } from "@repo/shared-types/portsAndUrl";


export default function MarketList() {
    const [markets, useMarkets] = useState<string[]>([]);

    useEffect(() => {
        async function getMarkets() {
            const { data }: { data: { markets: string[] } } = await axios.get(`${apiUrl}/markets`);
            useMarkets(data.markets);
        }
        getMarkets();
    }, []);

    return <div className="grid gap-2">
        <h2 className="text-3xl">Markets</h2>

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
                        <TableRow key={idx} className="cursor-pointer">
                            <TableCell className="font-medium">{splitted[0]}</TableCell>
                            <TableCell>{splitted[1]}</TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    </div>
}
