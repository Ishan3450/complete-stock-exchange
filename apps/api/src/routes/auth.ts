import { Router, Request, Response } from "express";
import { Client } from "pg";

export const authRouter = Router();

const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "exchange_db",
    password: "postgres",
    port: 5432,
});
createTableIfNotExists();

authRouter.post("/signup", async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.json({ type: "ERROR", message: "All fields are required" });
        }

        // check if user exists
        const checkUser = await client.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (checkUser.rows.length > 0) {
            return res.json({ type: "ERROR", message: "User already exists" });
        }

        // insert user
        const result = await client.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
            [username, email, password]
        );

        res.json({ type: "SUCCESS", userId: result.rows[0].id });
    } catch (error) {
        console.error(error);
        res.json({ type: "ERROR", message: "Server error" });
    }
});

authRouter.post("/signin", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ type: "ERROR", message: "Email and password required" });
        }

        // find user
        const result = await client.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.json({ type: "ERROR", message: "Invalid email or password" });
        }

        const user = result.rows[0];

        // compare password directly (not ideal, just for now)
        if (user.password !== password) {
            return res.json({ type: "ERROR", message: "Invalid email or password" });
        }

        res.json({ type: "SUCCESS", userId: user.id });
    } catch (error) {
        console.log(error);
        res.json({ type: "ERROR", message: "Server error" });
    }
});

async function createTableIfNotExists() {
    await client.connect();
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