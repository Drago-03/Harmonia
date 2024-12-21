import { Collection } from 'discord.js';

class ActivityManager {
    constructor() {
        this.sessions = new Map();
        this.MAX_PARTICIPANTS = 20;
        this.DEFAULT_TIMEOUT = 7200000; // 2 hours
    }

    async createSession(user, guildId) {
        const sessionId = `music_${Date.now()}_${user.id}`;
        
        try {
            const dmChannel = await user.createDM();
            const activityInvite = await dmChannel.createInvite({
                maxAge: 7200,
                maxUses: this.MAX_PARTICIPANTS,
                targetType: 2,
                targetApplication: process.env.ACTIVITY_APP_ID
            });

            const session = {
                id: sessionId,
                hostId: user.id,
                guildId: guildId,
                participants: new Set([user.id]),
                activityInvite,
                createdAt: Date.now(),
                timeout: setTimeout(() => this.endSession(sessionId), this.DEFAULT_TIMEOUT)
            };

            this.sessions.set(sessionId, session);
            return session;
        } catch (error) {
            console.error('Session creation error:', error);
            throw error;
        }
    }

    async joinSession(sessionId, userId) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        if (session.participants.size >= this.MAX_PARTICIPANTS) {
            throw new Error('Session is full');
        }

        session.participants.add(userId);
        return true;
    }

    endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        clearTimeout(session.timeout);
        this.sessions.delete(sessionId);
    }
}

export default new ActivityManager();