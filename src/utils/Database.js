import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

class Database {
    constructor() {
        this.db = null;
    }

    async connect() {
        this.db = await open({
            filename: './data/bot.db',
            driver: sqlite3.Database
        });

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS command_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                command TEXT,
                user_id TEXT,
                guild_id TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id TEXT PRIMARY KEY,
                top_artists TEXT,
                top_tracks TEXT,
                playlists TEXT
            );
        `);
    }

    async run(query, params = []) {
        return this.db.run(query, params);
    }

    async get(query, params = []) {
        return this.db.get(query, params);
    }

    async all(query, params = []) {
        return this.db.all(query, params);
    }
}

export default new Database();