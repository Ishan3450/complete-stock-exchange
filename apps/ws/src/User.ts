import { FrontendWebsocketMessageType } from "@repo/shared-types/src";
import { WebSocket } from "ws";

export class User {
    userId: string;
    private ws: WebSocket;

    public constructor(userId: string, ws: WebSocket) {
        this.userId = userId;
        this.ws = ws;

        this.ws.on("message", (message: string) => {

        })

        this.ws.on("close", () => {

        })
    }

    public subscribe(subscriptionName: string) {

    }

    public unSubscribe(subscriptionName: string) {

    }

    public emit(message: FrontendWebsocketMessageType): void {
        this.ws.emit(JSON.stringify(message));
    }
}