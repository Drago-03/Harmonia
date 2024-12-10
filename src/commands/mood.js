import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const moodCategories = {
    happy: { color: '#FFD700', emoji: '😊', genres: ['pop', 'dance', 'happy', 'upbeat'] },
    sad: { color: '#4169E1', emoji: '😢', genres: ['ballad', 'acoustic', 'slow'] },
    energetic: { color: '#FF4500', emoji: '⚡', genres: ['rock', 'electronic', 'edm'] },
    relaxed: { color: '#98FB98', emoji: '😌', genres: ['lofi', 'ambient', 'chill'] },
    focused: { color: '#800080', emoji: '🎯', genres: ['classical', 'instrumental', 'study'] }
};

export default {
    data: new SlashCommandBuilder()
        .setName('mood')
        .setDescription('Play music based on chat mood or specific emotion')
        .addStringOption(option =>
            option
                .setName('emotion')
                .setDescription('Specific mood to play music for')
                .addChoices(
                    { name: '😊 Happy', value: 'happy' },
                    { name: '😢 Sad', value: 'sad' },
                    { name: '⚡ Energetic', value: 'energetic' },
                    { name: '😌 Relaxed', value: 'relaxed' },
                    { name: '🎯 Focused', value: 'focused' }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            let selectedMood = interaction.options.getString('emotion');

            if (!selectedMood) {
                selectedMood = await analyzeChatMood(interaction.channel);
            }

            const moodInfo = moodCategories[selectedMood];
            const playlist = await generateMoodPlaylist(selectedMood);

            const visualizer = createMoodVisualizer(selectedMood);
            const embed = new EmbedBuilder()
                .setTitle(`${moodInfo.emoji} Mood-Based Music`)
                .setDescription([
                    `Current Mood: ${selectedMood.toUpperCase()}`,
                    '',
                    visualizer,
                    '',
                    '🎵 Generating your personalized playlist...'
                ].join('\n'))
                .setColor(moodInfo.color)
                .addFields(
                    { 
                        name: 'Mood Analysis', 
                        value: `${moodInfo.emoji} Detected Mood: ${selectedMood}\n${createMoodMeter(selectedMood)}`,
                        inline: false 
                    },
                    { 
                        name: 'Recommended Genres', 
                        value: moodInfo.genres.map(g => `\`${g}\``).join(', '), 
                        inline: false 
                    },
                    {
                        name: 'Coming Up',
                        value: playlist.slice(0, 5).map((song, i) => 
                            `${i + 1}. ${song.title}`).join('\n'),
                        inline: false
                    }
                )
                .setFooter({ text: '🎵 Music tailored to your current vibe' });

            await interaction.editReply({ embeds: [embed] });

            // Add songs to queue
            const queue = interaction.client.musicQueues.get(interaction.guildId);
            if (queue) {
                for (const song of playlist) {
                    await queue.addSong(song.url, interaction.user.id);
                }
            }

        } catch (error) {
            console.error('Mood command error:', error);
            await interaction.editReply('Failed to analyze mood or generate playlist.');
        }
    }
};

async function analyzeChatMood(channel) {
    try {
        const messages = await channel.messages.fetch({ limit: 10 });
        const recentMessages = messages.map(msg => msg.content).join('\n');

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `Analyze these chat messages and categorize the overall mood as either 'happy', 'sad', 'energetic', 'relaxed', or 'focused'. Only respond with one of these exact words:

        Messages:
        ${recentMessages}`;

        const result = await model.generateContent(prompt);
        const mood = result.response.text().trim().toLowerCase();
        
        return moodCategories[mood] ? mood : 'relaxed';
    } catch (error) {
        console.error('Mood analysis error:', error);
        return 'relaxed';
    }
}

function createMoodVisualizer(mood) {
    const visualizers = {
        happy: '💫 ⭐ 🌟 ✨ 🌟 ⭐ 💫',
        sad: '🌧️ 💭 💨 💭 🌧️ 💭 💨',
        energetic: '⚡ 💥 ⚡ 💥 ⚡ 💥 ⚡',
        relaxed: '🌊 🌺 🍃 🌺 🌊 🍃 🌺',
        focused: '🎯 💡 🎯 💡 🎯 💡 🎯'
    };
    return visualizers[mood] || visualizers.relaxed;
}

function createMoodMeter(mood) {
    const total = 10;
    const filled = Math.floor(Math.random() * 3) + 7; // 7-9 blocks for chosen mood
    const meter = '█'.repeat(filled) + '░'.repeat(total - filled);
    return `[${meter}] ${filled * 10}% match`;
}

async function generateMoodPlaylist(mood) {
    // Example playlist generation - replace with your actual implementation
    const moodPlaylists = {
        happy: [
            { title: "Walking on Sunshine", url: "spotify:track:1234" },
            { title: "Happy", url: "spotify:track:5678" }
        ],
        sad: [
            { title: "Someone Like You", url: "spotify:track:9012" },
            { title: "Say Something", url: "spotify:track:3456" }
        ],
        // ... add more mood playlists
    };

    return moodPlaylists[mood] || moodPlaylists.happy;
}