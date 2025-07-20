import { WebSocket, WebSocketServer } from "ws";
import { UserManager } from "./UserManager";

const user = new WebSocketServer({ port: 3001 });

user.on("connection", (ws: WebSocket) => {
    UserManager.getInstance().addUser(ws);
})
