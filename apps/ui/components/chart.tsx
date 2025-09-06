"use client";

import {
    CandlestickData,
    CandlestickSeries,
    createChart,
    CrosshairMode,
    IChartApi,
    ISeriesApi,
    Time,
    UTCTimestamp
} from "lightweight-charts";
import { useEffect, useRef } from "react";

type ChartProps = {
    chartData: CandlestickData<Time>[]
}

export default function Chart({ chartData }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        chartRef.current = createChart(chartContainerRef.current, {
            autoSize: true,
            crosshair: {
                mode: CrosshairMode.Normal,
            },
        });
        candlestickSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
            upColor: '#72bf6a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#72bf6a',
            wickDownColor: '#ef5350'
        });

        return () => {
            chartRef.current?.remove();
        };
    }, []);

    useEffect(() => {
        const data: CandlestickData<Time>[] = [
            { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 as UTCTimestamp },
            { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 as UTCTimestamp },
            { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 as UTCTimestamp },
            { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 as UTCTimestamp },
            { open: 9.51, high: 10.46, low: 9.10, close: 10.17, time: 1642773476 as UTCTimestamp },
            { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 as UTCTimestamp },
            { open: 10.47, high: 11.39, low: 10.40, close: 10.81, time: 1642946276 as UTCTimestamp },
            { open: 10.81, high: 11.60, low: 10.30, close: 10.75, time: 1643032676 as UTCTimestamp },
            { open: 10.75, high: 11.60, low: 10.49, close: 10.93, time: 1643119076 as UTCTimestamp },
            { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 as UTCTimestamp }];
        candlestickSeriesRef.current?.setData(chartData ?? data);
        chartRef.current?.timeScale().fitContent();
    }, [chartData]);

    return (
        <div ref={chartContainerRef} className="w-full h-full" />
    )
}