import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Learn more about Harmonia'),

    async execute(interaction) {
        // Get server statistics
        const totalServers = interaction.client.guilds.cache.size;
        const totalMembers = interaction.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const largeServers = interaction.client.guilds.cache.filter(g => g.memberCount > 1000).size;
        
        // Calculate growth metrics
        const serverGrowth = await getServerGrowth(interaction.client);

        const statsEmbed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setAuthor({
                name: 'Harmonia Music Bot',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setDescription([
                '### 🎵 Your Premium Music Companion',
                '',
                '> High-quality music playback with advanced features',
                '> and seamless integration for your Discord server.',
                '',
                '### 📊 Live Statistics',
                '```',
                `Servers     : ${formatNumber(totalServers)}`,
                `Large Guilds: ${formatNumber(largeServers)}`,
                `Members     : ${formatNumber(totalMembers)}`,
                `Growth      : ${serverGrowth > 0 ? '+' : ''}${serverGrowth} this week`,
                '```'
            ].join('\n'))
            .addFields(
                {
                    name: '🌟 Features',
                    value: [
                        '`🎵` High-Quality Music',
                        '`🎮` Easy Controls',
                        '`🎨` Visual Effects',
                        '`🤖` Smart Queue',
                        '`✨` Premium Features'
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📈 Server Stats',
                    value: [
                        '`📡` 99.9% Uptime',
                        `\`🔥\` ${formatNumber(largeServers)} Large Servers`,
                        `\`👥\` ${formatNumber(Math.floor(totalMembers/totalServers))} Avg. Users/Server`
                    ].join('\n'),
                    inline: true
                }
            )
            .setFooter({
                text: 'Created by madlol.gamer',
                iconURL: 'https://cdn.discord.com/avatars/your_id/avatar.png'
            })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel(`Add to Server (${formatNumber(totalServers)} servers trust us)`)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=277062449216&scope=bot`)
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setURL('https://discord.gg/your-invite')
                    .setStyle(ButtonStyle.Link)
            );

        await interaction.reply({ embeds: [statsEmbed], components: [row] });
    }
};

async function getServerGrowth(client) {
    // Implement server growth tracking
    // This is a placeholder - you should implement actual tracking
    return 25; // Example: 25 new servers this week
}

function formatUptime(uptime) {
    const days = Math.floor(uptime / 86400000);
    const hours = Math.floor((uptime % 86400000) / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ');
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}