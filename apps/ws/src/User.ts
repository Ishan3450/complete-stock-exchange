import { WebSocket } from "ws";

export class User {
    userId: string;
    ws: WebSocket;

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

    // public emit(message: Type Remaining) {
    //     this.ws.emit(JSON.stringify(message));
    // }

}