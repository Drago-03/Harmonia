import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';

export default {
    data: new SlashCommandBuilder()
        .setName('group')
        .setDescription('Manage music listening groups')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new listening group')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Name of the group')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Join an existing group')
                .addStringOption(option =>
                    option
                        .setName('code')
                        .setDescription('Group code')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Leave current group'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List group members and current queue')),

    async execute(interaction) {
        if (!interaction.member.voice.channel) {
            return await interaction.reply({
                content: 'You need to be in a voice channel!',
                ephemeral: true
            });
        }

        // Initialize groups if not exists
        if (!interaction.client.groups) {
            interaction.client.groups = new Map();
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create':
                await handleCreate(interaction);
                break;
            case 'join':
                await handleJoin(interaction);
                break;
            case 'leave':
                await handleLeave(interaction);
                break;
            case 'list':
                await handleList(interaction);
                break;
        }
    }
};

async function handleCreate(interaction) {
    const groupName = interaction.options.getString('name');
    const groupCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const group = {
        name: groupName,
        code: groupCode,
        host: interaction.user.id,
        members: new Set([interaction.user.id]),
        queue: [],
        currentSong: null,
        channels: new Set([interaction.member.voice.channelId]),
        createdAt: Date.now()
    };

    interaction.client.groups.set(groupCode, group);

    const embed = new EmbedBuilder()
        .setTitle('🎵 Group Created')
        .setDescription(`Group "${groupName}" has been created!`)
        .addFields(
            { name: 'Group Code', value: groupCode, inline: true },
            { name: 'Host', value: interaction.user.username, inline: true },
            { name: 'Members', value: '1', inline: true }
        )
        .setColor('#00ff00');

    await interaction.reply({ embeds: [embed] });
}

async function handleJoin(interaction) {
    const code = interaction.options.getString('code');
    const group = interaction.client.groups.get(code);

    if (!group) {
        return await interaction.reply({
            content: 'Invalid group code!',
            ephemeral: true
        });
    }

    if (group.members.has(interaction.user.id)) {
        return await interaction.reply({
            content: 'You are already in this group!',
            ephemeral: true
        });
    }

    group.members.add(interaction.user.id);
    group.channels.add(interaction.member.voice.channelId);

    // Sync current playback if any
    if (group.currentSong) {
        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const queue = interaction.client.musicQueues.get(interaction.guildId);
        if (queue) {
            await queue.playSong(group.currentSong, true);
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('👥 Joined Group')
        .setDescription(`You joined "${group.name}"!`)
        .addFields(
            { name: 'Members', value: `${group.members.size}`, inline: true },
            { name: 'Host', value: `<@${group.host}>`, inline: true }
        )
        .setColor('#00ff00');

    await interaction.reply({ embeds: [embed] });
}

async function handleLeave(interaction) {
    const group = findUserGroup(interaction);

    if (!group) {
        return await interaction.reply({
            content: 'You are not in any group!',
            ephemeral: true
        });
    }

    group.members.delete(interaction.user.id);
    group.channels.delete(interaction.member.voice.channelId);

    // If host leaves, transfer host or delete group
    if (group.host === interaction.user.id) {
        const newHost = Array.from(group.members)[0];
        if (newHost) {
            group.host = newHost;
        } else {
            interaction.client.groups.delete(group.code);
        }
    }

    await interaction.reply('You have left the group!');
}

async function handleList(interaction) {
    const group = findUserGroup(interaction);

    if (!group) {
        return await interaction.reply({
            content: 'You are not in any group!',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(`📋 Group: ${group.name}`)
        .addFields(
            { name: 'Members', value: Array.from(group.members).map(id => `<@${id}>`).join('\n') },
            { name: 'Host', value: `<@${group.host}>` }
        )
        .setColor('#0099ff');

    if (group.currentSong) {
        embed.addFields({ name: 'Now Playing', value: group.currentSong.title });
    }

    if (group.queue.length > 0) {
        embed.addFields({
            name: 'Queue',
            value: group.queue.map((song, i) => `${i + 1}. ${song.title}`).join('\n')
        });
    }

    await interaction.reply({ embeds: [embed] });
}

function findUserGroup(interaction) {
    for (const [_, group] of interaction.client.groups) {
        if (group.members.has(interaction.user.id)) {
            return group;
        }
    }
    return null;
}