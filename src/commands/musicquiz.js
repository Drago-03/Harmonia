import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import play from 'play-dl';

export default {
  data: new SlashCommandBuilder()
    .setName('musicquiz')
    .setDescription('Start a music quiz game')
    .addIntegerOption(option =>
      option
        .setName('rounds')
        .setDescription('Number of rounds (1-10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)),

  async execute(interaction) {
    const rounds = interaction.options.getInteger('rounds') || 5;
    const queue = interaction.client.musicQueues.get(interaction.guildId);
    
    if (!interaction.member.voice.channel) {
      return await interaction.reply('You need to be in a voice channel!');
    }

    const quizEmbed = new EmbedBuilder()
      .setTitle('🎵 Music Quiz')
      .setDescription('Starting quiz in 5 seconds...')
      .setColor('#3498db');

    await interaction.reply({ embeds: [quizEmbed] });

    // Quiz game logic here
    const songs = [
      { title: 'Never Gonna Give You Up', artist: 'Rick Astley', url: 'https://youtube.com/...' },
      // Add more songs
    ];

    let score = new Map();
    
    const connection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    // Start quiz rounds
    for (let i = 0; i < rounds; i++) {
      const song = songs[Math.floor(Math.random() * songs.length)];
      const stream = await play.stream(song.url);
      
      // Play 15 seconds of the song
      // Wait for answers
      // Update scores
    }

    // Show final scores
  }
};