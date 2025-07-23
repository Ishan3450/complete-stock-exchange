import { FrontendWebsocketMessageType, WebsocketFrontendMessageType } from "@repo/shared-types/src";
import { WebSocket } from "ws";
import { SubscriptionManager } from "./SubscriptionManager";
import { UserManager } from "./UserManager";

export class User {
    userId: string;
    private ws: WebSocket;

    public constructor(userId: string, ws: WebSocket) {
        this.userId = userId;
        this.ws = ws;

        this.ws.on("message", (message: string) => {
            const parsed: WebsocketFrontendMessageType = JSON.parse(message);

            if (parsed.type === "SUBSCRIBE") {
                SubscriptionManager.getInstance().subscribe(parsed.data.subscriptionName, this.userId);
            } else {
                SubscriptionManager.getInstance().unsubscribe(parsed.data.subscriptionName, this.userId);
            }
        })

        this.ws.on("close", () => {
            UserManager.getInstance().removeUser(this.userId);
            SubscriptionManager.getInstance().userLeft(this.userId);
        })
    }

    public emit(message: FrontendWebsocketMessageType): void {
        this.ws.emit(JSON.stringify(message));
    }
}