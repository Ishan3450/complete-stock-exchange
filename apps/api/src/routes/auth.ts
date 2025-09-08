import { Router, Request, Response } from "express";
import { RedisManager } from "../RedisManager";
import { dbClient } from "../dbClient";

export const authRouter = Router();

const client = dbClient;

(async () => {
    await createTableIfNotExists();
})();

authRouter.post("/signup", async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.json({ type: "Error", errorMsg: "All fields are required" });
        }

        const checkUserExists = await client.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (checkUserExists.rows.length > 0) {
            return res.json({ type: "Error", errorMsg: "User already exists" });
        }

        const result = await client.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
            [username, email, password]
        );

        const userId: string = String(result.rows[0].id);
        await createUserInEngine(userId);
        res.json({ type: "SUCCESS", userId });
    } catch (error) {
        console.error(error);
        res.json({ type: "Error", errorMsg: "Server error" });
    }
});

authRouter.post("/signin", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ type: "Error", errorMsg: "Email and password required" });
        }

        // find user
        const result = await client.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.json({ type: "Error", errorMsg: "Invalid email or password" });
        }

        const user = result.rows[0];

        // compare password directly (not ideal, just for now)
        if (user.password !== password) {
            return res.json({ type: "Error", errorMsg: "Invalid email or password" });
        }

        res.json({ type: "SUCCESS", userId: user.id });
    } catch (error) {
        console.error(error);
        res.json({ type: "Error", errorMsg: "Server error" });
    }
});

async function createTableIfNotExists() {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await client.query(query);
}

async function createUserInEngine(userId: string) {
    await RedisManager.getInstance().sendAndAwait({
        type: "ENGINE_CREATE_USER",
        data: {
            userId
        }
    })
}
