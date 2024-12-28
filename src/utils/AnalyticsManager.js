import database from './Database.js';

class AnalyticsManager {
    async getCommandUsage() {
        const result = await database.all('SELECT command, COUNT(*) as count FROM command_usage GROUP BY command ORDER BY count DESC');
        return result;
    }

    async getUserPreferences() {
        const result = await database.all('SELECT * FROM user_preferences');
        return result;
    }
}

export default new AnalyticsManager();