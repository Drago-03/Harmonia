import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import activityManager from '../utils/ActivityManager.js';
import premiumManager from '../utils/PremiumManager.js';

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