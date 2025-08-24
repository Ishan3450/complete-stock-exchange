import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type OrderBookProps = {
    assets: string[],
    openOrdersDepth: {
        bids: Record<number, number[]>,
        asks: Record<number, number[]>,
    }
}

export default function OrderBookDepth({ assets, openOrdersDepth }: OrderBookProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Price ({assets[1]})</TableHead>
                    <TableHead>Size ({assets[0]})</TableHead>
                    <TableHead>Total ({assets[0]})</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Object.entries(openOrdersDepth.bids).map(([price, values], idx) => (
                    <TableRow key={idx}>
                        <TableCell className="text-green-600 font-semibold">{price}</TableCell>
                        <TableCell>{values[0]}</TableCell>
                        <TableCell>{values[1]}</TableCell>
                    </TableRow>
                ))}
                <TableRow>
                    <TableCell colSpan={3}>
                    </TableCell>
                </TableRow>
                {Object.entries(openOrdersDepth.asks).map(([price, values], idx) => (
                    <TableRow key={idx}>
                        <TableCell className="text-red-500 font-semibold">{price}</TableCell>
                        <TableCell>{values[0]}</TableCell>
                        <TableCell>{values[1]}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}