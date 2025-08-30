import { Trade } from "@repo/shared-types/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFormattedValue } from "@/lib/common";

type TradesProps = {
    trades: Trade[],
    assets: string[],
}

export function Trades({ trades, assets }: TradesProps) {
    return <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Price ({assets[1]})</TableHead>
                <TableHead>Quantity ({assets[0]})</TableHead>
                <TableHead>Timestamp</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {trades.map((trade, idx) => (
                <TableRow key={idx}>
                    <TableCell className={`${trade.side === 'buy' ? 'text-green-600' : 'text-red-400'} font-semibold`}>{getFormattedValue(Number(trade.price))}</TableCell>
                    <TableCell>{getFormattedValue(Number(trade.quantity))}</TableCell>
                    <TableCell>{new Date(trade.timestamp).toLocaleString()}</TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
}