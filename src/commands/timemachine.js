import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';

const eraData = {
    '50s': { start: 1950, end: 1959, style: 'Rock and Roll, Doo-wop' },
    '60s': { start: 1960, end: 1969, style: 'Psychedelic Rock, Motown' },
    '70s': { start: 1970, end: 1979, style: 'Disco, Progressive Rock' },
    '80s': { start: 1980, end: 1989, style: 'New Wave, Pop' },
    '90s': { start: 1990, end: 1999, style: 'Grunge, Hip Hop' },
    '00s': { start: 2000, end: 2009, style: 'R&B, Pop Rock' },
};

export default {
    data: new SlashCommandBuilder()
        .setName('timemachine')
        .setDescription('Travel through music history')
        .addStringOption(option =>
            option.setName('era')
                .setDescription('Choose an era')
                .setRequired(true)
                .addChoices(
                    { name: '50s', value: '50s' },
                    { name: '60s', value: '60s' },
                    { name: '70s', value: '70s' },
                    { name: '80s', value: '80s' },
                    { name: '90s', value: '90s' },
                    { name: '00s', value: '00s' }
                ))
        .addStringOption(option =>
            option.setName('genre')
                .setDescription('Specific genre (optional)')
                .setRequired(false)),

    async execute(interaction) {
        const era = interaction.options.getString('era');
        const genre = interaction.options.getString('genre');
        
        if (!interaction.member.voice.channel) {
            return await interaction.reply('You need to be in a voice channel to time travel!');
        }

        const eraInfo = eraData[era];
        const historicalFacts = await getHistoricalFacts(era);
        const playlist = await generateEraPlaylist(era, genre);

        const timeMachineEmbed = new EmbedBuilder()
            .setTitle(`🕰️ Time Machine: ${era}`)
            .setDescription(`Welcome to the ${era}! Preparing your musical journey...`)
            .addFields(
                { name: 'Popular Genres', value: eraInfo.style, inline: true },
                { name: 'Time Period', value: `${eraInfo.start}-${eraInfo.end}`, inline: true },
                { name: 'Fun Fact', value: historicalFacts[0], inline: false },
                { name: 'Up Next', value: formatPlaylist(playlist.slice(0, 5)), inline: false }
            )
            .setColor(getEraColor(era));

        // Initialize era-specific effects
        const queue = interaction.client.musicQueues.get(interaction.guildId);
        if (queue) {
            queue.setEraEffects(era);
            await queue.clearQueue();
            await queue.addSongs(playlist);
        }

        await interaction.reply({ embeds: [timeMachineEmbed] });
        startEraPlayback(interaction, playlist);
    }
};

async function getHistoricalFacts(era) {
    const facts = {
        '50s': ['Elvis Presley made his first TV appearance in 1956.'],
        '60s': ['The Beatles appeared on Ed Sullivan in 1964.'],
        '70s': ['Disco emerged as a major genre in 1974.'],
        '80s': ['MTV launched on August 1, 1981.'],
        '90s': ['Nirvana's "Nevermind" topped charts in 1991.'],
        '00s': ['iPod was released in 2001, revolutionizing music.']
    };
    return facts[era] || ['Loading historical facts...'];
}

async function generateEraPlaylist(era, genre) {
    // Implementation would connect to music database
    // and filter songs by era/genre
    return [
        { title: 'Example Song 1', year: eraData[era].start },
        { title: 'Example Song 2', year: eraData[era].start + 2 }
    ];
}

function formatPlaylist(songs) {
    return songs.map(song => `• ${song.title} (${song.year})`).join('\n');
}

function getEraColor(era) {
    const colors = {
        '50s': '#FFD700', // Gold
        '60s': '#FF6B6B', // Retro Red
        '70s': '#9370DB', // Disco Purple
        '80s': '#00FF00', // Neon Green
        '90s': '#4B0082', // Deep Purple
        '00s': '#4169E1'  // Royal Blue
    };
    return colors[era] || '#FFFFFF';
}

async function startEraPlayback(interaction, playlist) {
    const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    // Add era-specific audio effects and transitions
    const queue = interaction.client.musicQueues.get(interaction.guildId);
    if (queue) {
        queue.setEraSpecificEffects();
        await queue.play();
    }
}