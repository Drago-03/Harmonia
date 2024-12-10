import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('share')
        .setDescription('Share music with other users')
        .addSubcommand(subcommand =>
            subcommand
                .setName('song')
                .setDescription('Share the currently playing song'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('playlist')
                .setDescription('Share your current queue as a playlist')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name for the shared playlist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('favorites')
                .setDescription('Share your favorite tracks')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'song':
                await handleShareSong(interaction);
                break;
            case 'playlist':
                await handleSharePlaylist(interaction);
                break;
            case 'favorites':
                await handleShareFavorites(interaction);
                break;
        }
    }
};

async function handleShareSong(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);
    
    if (!queue?.currentSong) {
        return await interaction.reply({
            content: 'No song is currently playing!',
            ephemeral: true
        });
    }

    const shareCode = generateShareCode();
    const songData = {
        title: queue.currentSong.title,
        url: queue.currentSong.url,
        sharedBy: interaction.user.id,
        timestamp: Date.now()
    };

    // Store shared song
    if (!interaction.client.sharedContent) {
        interaction.client.sharedContent = new Map();
    }
    interaction.client.sharedContent.set(shareCode, songData);

    const embed = new EmbedBuilder()
        .setTitle('🎵 Shared Song')
        .setDescription(`${queue.currentSong.title}`)
        .addFields(
            { name: 'Share Code', value: shareCode, inline: true },
            { name: 'Shared By', value: interaction.user.username, inline: true },
            { name: 'How to Play', value: `Use \`/play share:${shareCode}\` to play this song` }
        )
        .setColor('#00ff00');

    await interaction.reply({ embeds: [embed] });
}

async function handleSharePlaylist(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);
    const playlistName = interaction.options.getString('name');
    
    if (!queue?.queue.length && !queue?.currentSong) {
        return await interaction.reply({
            content: 'No songs in queue to share!',
            ephemeral: true
        });
    }

    const shareCode = generateShareCode();
    const playlistData = {
        name: playlistName,
        songs: queue.currentSong ? [queue.currentSong, ...queue.queue] : queue.queue,
        sharedBy: interaction.user.id,
        timestamp: Date.now()
    };

    // Store shared playlist
    if (!interaction.client.sharedContent) {
        interaction.client.sharedContent = new Map();
    }
    interaction.client.sharedContent.set(shareCode, playlistData);

    const embed = new EmbedBuilder()
        .setTitle('📋 Shared Playlist')
        .setDescription(playlistName)
        .addFields(
            { name: 'Songs', value: `${playlistData.songs.length} tracks`, inline: true },
            { name: 'Share Code', value: shareCode, inline: true },
            { name: 'How to Play', value: `Use \`/play share:${shareCode}\` to play this playlist` }
        )
        .setColor('#00ff00');

    await interaction.reply({ embeds: [embed] });
}

async function handleShareFavorites(interaction) {
    // Get user's favorites from database
    const favorites = await getFavorites(interaction.user.id);
    
    if (!favorites?.length) {
        return await interaction.reply({
            content: 'You have no favorite tracks to share!',
            ephemeral: true
        });
    }

    const shareCode = generateShareCode();
    const favoritesData = {
        name: `${interaction.user.username}'s Favorites`,
        songs: favorites,
        sharedBy: interaction.user.id,
        timestamp: Date.now()
    };

    // Store shared favorites
    if (!interaction.client.sharedContent) {
        interaction.client.sharedContent = new Map();
    }
    interaction.client.sharedContent.set(shareCode, favoritesData);

    const embed = new EmbedBuilder()
        .setTitle('⭐ Shared Favorites')
        .setDescription(`${interaction.user.username}'s Favorite Tracks`)
        .addFields(
            { name: 'Tracks', value: `${favorites.length} songs`, inline: true },
            { name: 'Share Code', value: shareCode, inline: true },
            { name: 'How to Play', value: `Use \`/play share:${shareCode}\` to play these tracks` }
        )
        .setColor('#FFD700');

    await interaction.reply({ embeds: [embed] });
}

function generateShareCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function getFavorites(userId) {
    // Implement database query for user's favorites
    // This is a placeholder
    return [];
}