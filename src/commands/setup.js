import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';

export default {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup dedicated music channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Create category
            const category = await interaction.guild.channels.create({
                name: '🎵 Harmonia Music',
                type: ChannelType.GuildCategory,
                position: 0
            });

            // Create text channel
            const textChannel = await interaction.guild.channels.create({
                name: '🎵︱music-commands',
                type: ChannelType.GuildText,
                parent: category,
                topic: 'Use music commands here! Type / to see available commands.',
                rateLimitPerUser: 3
            });

            // Create voice channel
            const voiceChannel = await interaction.guild.channels.create({
                name: '🎵︱Music Room',
                type: ChannelType.GuildVoice,
                parent: category,
                userLimit: 0,
                bitrate: interaction.guild.premiumTier === 'NONE' ? 64000 : 128000
            });

            // Set category permissions
            await category.permissionOverwrites.set([
                {
                    id: interaction.guild.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak
                    ]
                },
                {
                    id: interaction.client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak,
                        PermissionFlagsBits.MoveMembers,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.EmbedLinks
                    ]
                }
            ]);

            // Join voice channel for 24/7
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: false
            });

            // Store voice channel ID for reconnection
            if (!interaction.client.music24_7) {
                interaction.client.music24_7 = new Map();
            }
            interaction.client.music24_7.set(interaction.guildId, voiceChannel.id);

            // Create welcome message
            const welcomeEmbed = new EmbedBuilder()
                .setTitle('🎵 Welcome to Harmonia Music!')
                .setDescription([
                    '**Quick Start Guide:**',
                    '',
                    '`1.` Join the voice channel above',
                    '`2.` Use `/play` to play music',
                    '`3.` Use `/help` to see all commands',
                    '',
                    '**Features:**',
                    '• High quality music',
                    '• Easy-to-use commands',
                    '• 24/7 music playback',
                    '• Playlist support',
                    '',
                    '*Note: The bot will stay in the voice channel 24/7!*'
                ].join('\n'))
                .setColor('#9B59B6')
                .setFooter({
                    text: 'Setup completed successfully!',
                    iconURL: interaction.client.user.displayAvatarURL()
                });

            await textChannel.send({ embeds: [welcomeEmbed] });

            // Pin the welcome message
            const welcomeMessage = await textChannel.messages.fetch({ limit: 1 });
            await welcomeMessage.first().pin();

            await interaction.editReply({
                content: 'Setup completed! Check out the new category above.',
                ephemeral: true
            });

        } catch (error) {
            console.error('Setup error:', error);
            await interaction.editReply({
                content: 'Failed to complete setup. Make sure I have proper permissions!',
                ephemeral: true
            });
        }
    }
};