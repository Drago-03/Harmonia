class UserManager {
    constructor() {
        this.users = new Map();
    }

    addUser(userId, data) {
        this.users.set(userId, data);
    }

    getUser(userId) {
        return this.users.get(userId);
    }

    updateUser(userId, data) {
        this.users.set(userId, { ...this.users.get(userId), ...data });
    }
}

export default new UserManager();