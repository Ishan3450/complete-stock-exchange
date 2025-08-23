import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";
import { wsPort, wsUrl } from "@repo/shared-types/portsAndUrl";

const user = new WebSocketServer({ port: wsPort });

user.on("connection", (ws, req) => {
    const uid = new URL(req.url!, wsUrl).searchParams.get("uid");
    UserManager.getInstance().addUser(uid!, ws);
})
