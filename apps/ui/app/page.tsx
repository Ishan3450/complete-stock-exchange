"use client"

import Container from "@/components/container";
import MarketList from "@/components/market_list";
import { wsUrl } from "@repo/shared-types/portsAndUrl";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log("Message from server:", data)
    }

    ws.current.onclose = () => {
      console.log("Disconnected from WS server")
    }

    ws.current.onerror = (err) => {
      console.error("WS error:", err)
    }

    // window.addEventListener("beforeunload", closeTheWsConnection);
  }, []);

  return (
    <Container>
      <MarketList />
    </Container>
  );
}
