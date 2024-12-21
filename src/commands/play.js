import { SlashCommandBuilder } from 'discord.js';
import activityManager from '../utils/ActivityManager.js';
import premiumManager from '../utils/PremiumManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Start a music session')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('Song to play')
                .setRequired(true)),

    async execute(interaction) {
        try {
            // Check if user is in voice channel
            if (!interaction.member.voice.channel) {
                return await interaction.reply('Join a voice channel first!');
            }

            // Create or join session
            const existingSession = activityManager.sessions.find(s => 
                s.guildId === interaction.guildId);

            if (existingSession) {
                await activityManager.joinSession(existingSession.id, interaction.user.id);
                return await interaction.reply({
                    content: 'Joined existing session!',
                    components: [createActivityButton(existingSession.activityInvite)]
                });
            }

            // Create new session
            const session = await activityManager.createSession(
                interaction.user, 
                interaction.guildId
            );

            const embed = {
                title: '🎵 Music Session Started',
                description: 'Click below to join the music party!',
                fields: [
                    {
                        name: 'Host',
                        value: interaction.user.tag,
                        inline: true
                    },
                    {
                        name: 'Participants',
                        value: `1/${activityManager.MAX_PARTICIPANTS}`,
                        inline: true
                    }
                ]
            };

            await interaction.reply({
                embeds: [embed],
                components: [createActivityButton(session.activityInvite)]
            });

        } catch (error) {
            console.error('Play command error:', error);
            await interaction.reply('Failed to start music session');
        }
    }
};

function createActivityButton(invite) {
    return {
        type: 1,
        components: [{
            type: 2,
            label: 'Join Session',
            style: 5,
            url: invite.url
        }]
    };
}