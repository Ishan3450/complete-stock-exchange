const { Client } = require('pg');

export const dbClient = new Client({
    user: "postgres",
    host: "localhost",
    database: "exchange_db",
    password: "postgres",
    port: 5432,
});

async function connectClient() {
    try {
        await dbClient.connect();
        console.log('PostgreSQL client connected');
    } catch (err) {
        console.error('Error connecting PostgreSQL client', err);
        connectClient(); // retry
    }
}

connectClient();
