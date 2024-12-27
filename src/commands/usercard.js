import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import spotifyAPI from '../utils/SpotifyAPI.js';

export default {
    data: new SlashCommandBuilder()
        .setName('usercard')
        .setDescription('Display your Spotify user card'),

    async execute(interaction) {
        try {
            const [topArtists, topTracks, playlists] = await Promise.all([
                spotifyAPI.getUserTopArtists(),
                spotifyAPI.getUserTopTracks(),
                spotifyAPI.getUserPlaylists()
            ]);

            const embed = new EmbedBuilder()
                .setTitle(`${interaction.user.username}'s Spotify User Card`)
                .setColor('#1DB954')
                .addFields(
                    { name: 'Top Artists', value: topArtists.map(artist => artist.name).join(', ') || 'None', inline: true },
                    { name: 'Top Tracks', value: topTracks.map(track => track.name).join(', ') || 'None', inline: true },
                    { name: 'Playlists', value: playlists.map(playlist => playlist.name).join(', ') || 'None', inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('User card error:', error);
            await interaction.reply({
                content: 'Failed to fetch user data from Spotify',
                ephemeral: true
            });
        }
    }
};