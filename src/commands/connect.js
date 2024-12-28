import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import spotifyAPI from '../utils/SpotifyAPI.js';
import userManager from '../utils/UserManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('connect')
        .setDescription('Connect your Spotify account'),

    async execute(interaction) {
        const authUrl = spotifyAPI.getAuthUrl();
        const embed = new EmbedBuilder()
            .setTitle('Connect Your Spotify Account')
            .setDescription(`[Click here to connect your Spotify account](${authUrl})`)
            .setColor('#1DB954');

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};