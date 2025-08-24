import { wsUrl } from "@repo/shared-types/portsAndUrl";
import { toast } from "sonner";

let ws: WebSocket | null = null;
let wsPromise: Promise<WebSocket> | null = null;

export function getWebSocket(): Promise<WebSocket> {
    if (ws && ws.readyState === WebSocket.OPEN) {
        return Promise.resolve(ws);
    }

    if (!wsPromise) {
        wsPromise = new Promise((resolve, reject) => {
            const userId = localStorage.getItem("uid");
            if (!userId) {
                toast.warning("Please signin or signup first !!");
                window.location.href = "/signin";
                reject(new Error("User not authenticated"));
                return;
            }

            ws = new WebSocket(`${wsUrl}?uid=${userId}`);

            ws.onopen = () => {
                console.log("Connected to WS server");
                resolve(ws!);
            };

            // NOTE: this will be declared in their respective file (atleast for now)
            // ws.onmessage = (event) => {
            //     const data = JSON.parse(event.data)
            //     console.log("Message from server:", data)
            // }

            ws.onclose = () => {
                console.log("Disconnected from WS server")
                ws = null;
                wsPromise = null;
            }

            ws.onerror = (err) => {
                console.error("WS error:", err)
                reject(err);
                ws = null;
                wsPromise = null;
            }
        });
    }
    return wsPromise;
}
