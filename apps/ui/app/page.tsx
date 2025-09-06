"use client"

import Container from "@/components/container";
import MarketList from "@/components/market_list";
import { getWebSocket } from "@/lib/websocket";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  // const ws = useRef<WebSocket | null>(null);

  // useEffect(() => {
  //   getWebSocket().then((wsRes) => {
  //     ws.current = wsRes;
  //   });
  // }, []);

  return (
    <Container className="py-3">
      <MarketList />
    </Container>
  );
}
