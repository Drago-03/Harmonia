import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

function createProgressBar(value, maxValue, size = 20) {
    const percentage = value / maxValue;
    const progress = Math.round(size * percentage);
    const emptyProgress = size - progress;
    const progressText = '█'.repeat(progress);
    const emptyProgressText = '░'.repeat(emptyProgress);
    return progressText + emptyProgressText;
}

function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

function calculateServerScore(guild) {
    let score = 0;
    score += guild.memberCount * 0.3;
    score += guild.premiumSubscriptionCount * 2;
    score += guild.emojis.cache.size * 0.2;
    score += guild.stickers.cache.size * 0.3;
    return Math.min(100, Math.floor(score));
}

export default {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display detailed server information with beautiful visualization'),

    async execute(interaction) {
        const { guild } = interaction;
        
        // Get detailed statistics
        const totalMembers = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(m => m.presence?.status === 'online').size;
        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount;
        const serverScore = calculateServerScore(guild);
        
        // Calculate creation date
        const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
        const createdDays = Math.floor((Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24));

        // Create aesthetic embed
        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} | Server Information`)
            .setDescription(`🏆 Server Score: ${serverScore}/100\n${createProgressBar(serverScore, 100)}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .setImage(guild.bannerURL({ size: 1024 }) || '')
            .setColor(guild.members.me.displayHexColor)
            .addFields(
                {
                    name: '👑 Owner',
                    value: `<@${guild.ownerId}>`,
                    inline: true
                },
                {
                    name: '📊 Member Count',
                    value: `${formatNumber(totalMembers)}`,
                    inline: true
                },
                {
                    name: '📈 Boost Status',
                    value: `Level ${boostLevel} (${boostCount} boosts)\n${createProgressBar(boostCount, 14)}`,
                    inline: true
                },
                {
                    name: '🎨 Customization',
                    value: [
                        `• ${guild.emojis.cache.size} Custom Emojis`,
                        `• ${guild.stickers.cache.size} Stickers`,
                        `• ${guild.roles.cache.size} Roles`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🏷️ Channels',
                    value: [
                        `• ${guild.channels.cache.filter(c => c.type === 0).size} Text`,
                        `• ${guild.channels.cache.filter(c => c.type === 2).size} Voice`,
                        `• ${guild.channels.cache.filter(c => c.type === 15).size} Forums`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🛡️ Security',
                    value: [
                        `• Verification: ${guild.verificationLevel}`,
                        `• 2FA: ${guild.mfaLevel ? 'Required' : 'Not Required'}`,
                        `• Explicit Filter: ${guild.explicitContentFilter}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎯 Features',
                    value: guild.features.map(f => `\`${f.toLowerCase().replace(/_/g, ' ')}\``).join(', ') || 'No special features',
                },
                {
                    name: '⏰ Server Age',
                    value: `Created <t:${createdTimestamp}:R>\n${formatNumber(createdDays)} days ago`,
                }
            )
            .setFooter({
                text: `Server ID: ${guild.id} | Region: ${guild.preferredLocale}`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        // Add vanity URL if exists
        if (guild.vanityURLCode) {
            embed.addFields({
                name: '🔗 Vanity URL',
                value: `discord.gg/${guild.vanityURLCode}`
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};