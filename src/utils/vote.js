class VoteManager {
    constructor() {
        this.activeVotes = new Map();
        this.VOTE_TIMEOUT = 30000; // 30 seconds timeout
    }

    createVote(guildId, userId, type) {
        if (this.activeVotes.has(guildId)) {
            return { status: false, message: 'A vote is already in progress.' };
        }

        const vote = {
            type,
            initiator: userId,
            votes: new Set([userId]),
            timestamp: Date.now(),
            timeout: setTimeout(() => this.endVote(guildId), this.VOTE_TIMEOUT)
        };

        this.activeVotes.set(guildId, vote);
        return { status: true, vote };
    }

    addVote(guildId, userId) {
        const vote = this.activeVotes.get(guildId);
        if (!vote) return false;

        vote.votes.add(userId);
        return true;
    }

    getRequiredVotes(memberCount) {
        if (memberCount <= 2) return 1;
        if (memberCount === 3) return 2;
        return 2; // For 4 or more members
    }

    hasEnoughVotes(guildId, memberCount) {
        const vote = this.activeVotes.get(guildId);
        if (!vote) return false;

        const required = this.getRequiredVotes(memberCount);
        return vote.votes.size >= required;
    }

    endVote(guildId) {
        const vote = this.activeVotes.get(guildId);
        if (!vote) return null;

        clearTimeout(vote.timeout);
        this.activeVotes.delete(guildId);
        return vote;
    }

    getActiveVote(guildId) {
        return this.activeVotes.get(guildId);
    }

    getRemainingTime(guildId) {
        const vote = this.activeVotes.get(guildId);
        if (!vote) return 0;

        const elapsed = Date.now() - vote.timestamp;
        return Math.max(0, this.VOTE_TIMEOUT - elapsed);
    }

    getVoters(guildId) {
        const vote = this.activeVotes.get(guildId);
        return vote ? Array.from(vote.votes) : [];
    }
}

// Export a single instance to be used across the application
export const voteManager = new VoteManager();