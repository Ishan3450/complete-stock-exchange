import { WebSocket, WebSocketServer } from "ws";
import { UserManager } from "./UserManager";
import { wsPort } from "@repo/shared-types/portsAndUrl";

const user = new WebSocketServer({ port: wsPort });

user.on("connection", (ws: WebSocket) => {
    UserManager.getInstance().addUser(ws);
})
