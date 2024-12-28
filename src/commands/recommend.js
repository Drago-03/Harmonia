import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import spotifyAPI from '../utils/SpotifyAPI.js';
import userManager from '../utils/UserManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('recommend')
        .setDescription('Recommend songs based on your Spotify data'),

    async execute(interaction) {
        const user = userManager.getUser(interaction.user.id);
        if (!user || !user.accessToken) {
            return await interaction.reply('You need to connect your Spotify account first using `/connect`.', { ephemeral: true });
        }

        const [topTracks, topArtists, playlists] = await Promise.all([
            spotifyAPI.getUserTopTracks(user.accessToken),
            spotifyAPI.getUserTopArtists(user.accessToken),
            spotifyAPI.getUserPlaylists(user.accessToken)
        ]);

        const embed = new EmbedBuilder()
            .setTitle('🎵 Recommended Songs')
            .setDescription('Based on your Spotify data')
            .setColor('#1DB954')
            .addFields(
                { name: 'Top Tracks', value: topTracks.map(track => track.name).join(', ') || 'None', inline: true },
                { name: 'Top Artists', value: topArtists.map(artist => artist.name).join(', ') || 'None', inline: true },
                { name: 'Playlists', value: playlists.map(playlist => playlist.name).join(', ') || 'None', inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};