import database from './Database.js';

class UserManager {
    constructor() {
        this.users = new Map();
    }

    async addUser(userId, data) {
        this.users.set(userId, data);
        await database.run(
            'INSERT OR REPLACE INTO user_preferences (user_id, top_artists, top_tracks, playlists) VALUES (?, ?, ?, ?)',
            [userId, JSON.stringify(data.top_artists), JSON.stringify(data.top_tracks), JSON.stringify(data.playlists)]
        );
    }

    async getUser(userId) {
        if (this.users.has(userId)) {
            return this.users.get(userId);
        }

        const user = await database.get('SELECT * FROM user_preferences WHERE user_id = ?', [userId]);
        if (user) {
            user.top_artists = JSON.parse(user.top_artists);
            user.top_tracks = JSON.parse(user.top_tracks);
            user.playlists = JSON.parse(user.playlists);
            this.users.set(userId, user);
        }
        return user;
    }

    async updateUser(userId, data) {
        const user = await this.getUser(userId);
        const updatedUser = { ...user, ...data };
        this.users.set(userId, updatedUser);
        await database.run(
            'UPDATE user_preferences SET top_artists = ?, top_tracks = ?, playlists = ? WHERE user_id = ?',
            [JSON.stringify(updatedUser.top_artists), JSON.stringify(updatedUser.top_tracks), JSON.stringify(updatedUser.playlists), userId]
        );
    }
}

export default new UserManager();