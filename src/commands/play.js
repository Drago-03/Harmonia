import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import activityManager from '../utils/ActivityManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Start a music activity session')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('Song to play')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.voice.channel) {
            return await interaction.reply({
                content: 'You need to be in a voice channel first!',
                ephemeral: true
            });
        }

        try {
            const session = await activityManager.createSession(
                interaction.user,
                interaction.guildId
            );

            const embed = new EmbedBuilder()
                .setTitle('🎵 Music Session Started')
                .setDescription(`Click below to join the party! (${session.participants.size}/${activityManager.MAX_PARTICIPANTS} participants)`)
                .addFields(
                    { name: 'Host', value: interaction.user.tag, inline: true },
                    { name: 'Duration', value: '2 hours', inline: true }
                )
                .setColor('#00ff00');

            const components = [{
                type: 1,
                components: [{
                    type: 2,
                    style: 5,
                    label: 'Join Session',
                    url: session.activityInvite.url
                }]
            }];

            await interaction.reply({
                embeds: [embed],
                components: components
            });

        } catch (error) {
            console.error('Play command error:', error);
            await interaction.reply({
                content: 'Failed to start music session',
                ephemeral: true
            });
        }
    }
};
class ActivityManager {
    constructor() {
        this.sessions = new Map();
        this.MAX_PARTICIPANTS = 20;
        this.DEFAULT_TIMEOUT = 7200000; // 2 hours
    }

    async createSession(user, guildId) {
        const sessionId = `music_${Date.now()}_${user.id}`;
        
        try {
            // Create DM channel activity session
            const dmChannel = await user.createDM();
            const activityInvite = await dmChannel.createInvite({
                maxAge: 7200,
                maxUses: this.MAX_PARTICIPANTS,
                targetType: 2,
                targetApplication: process.env.ACTIVITY_APP_ID || '773336526917861400'
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
}

export const activityManagerInstance = new ActivityManager();