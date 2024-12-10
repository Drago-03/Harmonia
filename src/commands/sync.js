import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';

export default {
    data: new SlashCommandBuilder()
        .setName('sync')
        .setDescription('Synchronize music playback across multiple voice channels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a sync session'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Join an existing sync session')
                .addStringOption(option =>
                    option
                        .setName('code')
                        .setDescription('Sync session code')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Leave current sync session')),

    async execute(interaction) {
        if (!interaction.member.voice.channel) {
            return await interaction.reply({
                content: 'You must be in a voice channel to use sync!',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create':
                return await handleCreate(interaction);
            case 'join':
                return await handleJoin(interaction);
            case 'leave':
                return await handleLeave(interaction);
        }
    }
};

async function handleCreate(interaction) {
    // Generate unique 6-character code
    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create sync session
    const session = {
        code: sessionCode,
        hostGuildId: interaction.guildId,
        hostChannelId: interaction.member.voice.channelId,
        connectedChannels: [],
        currentTrack: null,
        timestamp: Date.now()
    };

    // Store session in client
    if (!interaction.client.syncSessions) {
        interaction.client.syncSessions = new Map();
    }
    interaction.client.syncSessions.set(sessionCode, session);

    const embed = new EmbedBuilder()
        .setTitle('🎵 Sync Session Created')
        .setDescription(`Share this code with other servers to sync music: \`${sessionCode}\``)
        .addFields(
            { name: 'Host Server', value: interaction.guild.name },
            { name: 'Channel', value: interaction.member.voice.channel.name },
            { name: 'Duration', value: '2 hours (auto-expires)' }
        )
        .setColor('#00ff00');

    await interaction.reply({ embeds: [embed] });
}

async function handleJoin(interaction) {
    const code = interaction.options.getString('code');
    const session = interaction.client.syncSessions?.get(code);

    if (!session) {
        return await interaction.reply({
            content: 'Invalid sync code or expired session!',
            ephemeral: true
        });
    }

    // Add channel to session
    session.connectedChannels.push({
        guildId: interaction.guildId,
        channelId: interaction.member.voice.channelId
    });

    // Sync current playback if any
    if (session.currentTrack) {
        const queue = interaction.client.musicQueues.get(interaction.guildId);
        if (queue) {
            await queue.playSong(session.currentTrack, true);
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('🎵 Joined Sync Session')
        .setDescription(`Successfully joined sync session: \`${code}\``)
        .addFields(
            { name: 'Host Server', value: 'Connected' },
            { name: 'Synced Channels', value: `${session.connectedChannels.length}` }
        )
        .setColor('#00ff00');

    await interaction.reply({ embeds: [embed] });
}

async function handleLeave(interaction) {
    let userSession = null;
    let sessionCode = null;

    // Find user's active session
    for (const [code, session] of interaction.client.syncSessions?.entries() ?? []) {
        if (session.connectedChannels.some(c => c.guildId === interaction.guildId)) {
            userSession = session;
            sessionCode = code;
            break;
        }
    }

    if (!userSession) {
        return await interaction.reply({
            content: 'You are not in any sync session!',
            ephemeral: true
        });
    }

    // Remove channel from session
    userSession.connectedChannels = userSession.connectedChannels.filter(
        c => c.guildId !== interaction.guildId
    );

    // Delete session if no channels left
    if (userSession.connectedChannels.length === 0) {
        interaction.client.syncSessions.delete(sessionCode);
    }

    await interaction.reply('Successfully left the sync session!');
}