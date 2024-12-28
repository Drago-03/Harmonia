import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import analyticsManager from '../utils/AnalyticsManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('Display bot analytics'),

    async execute(interaction) {
        const commandUsage = await analyticsManager.getCommandUsage();
        const userPreferences = await analyticsManager.getUserPreferences();

        const embed = new EmbedBuilder()
            .setTitle('📊 Bot Analytics')
            .setColor('#3498db')
            .addFields(
                { name: 'Top Commands', value: commandUsage.map(c => `${c.command}: ${c.count}`).join('\n') || 'None', inline: true },
                { name: 'User Preferences', value: userPreferences.map(u => `${u.user_id}: ${u.top_artists.length} artists, ${u.top_tracks.length} tracks, ${u.playlists.length} playlists`).join('\n') || 'None', inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};