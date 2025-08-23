import { wsUrl } from "@repo/shared-types/portsAndUrl";
import { toast } from "sonner";

let ws: WebSocket | null = null;

export function getWebSocket() {
    if (!ws) {
        const userId = localStorage.getItem("uid");
        if (!userId) {
            toast.warning("Please signin or signup first !!");
            window.location.href = "/signin";
        }
        ws = new WebSocket(`${wsUrl}?uid=${userId}`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log("Message from server:", data)
        }

        ws.onclose = () => {
            console.log("Disconnected from WS server")
        }

        ws.onerror = (err) => {
            console.error("WS error:", err)
        }
    }
    return ws;
}
