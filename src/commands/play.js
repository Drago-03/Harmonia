import { SlashCommandBuilder } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import { MusicPlayer } from '../utils/MusicPlayer.js';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('The song to play')
        .setRequired(true)),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    
    if (!interaction.member.voice.channel) {
      return await interaction.reply('You need to be in a voice channel!');
    }

    let queue = interaction.client.musicQueues.get(interaction.guildId);
    
    if (!queue) {
      queue = new MusicPlayer();
      interaction.client.musicQueues.set(interaction.guildId, queue);
    }

    try {
      const song = await queue.addSong(query);
      await interaction.reply(`Added to queue: ${song.title}`);

      if (!queue.currentSong) {
        const connection = joinVoiceChannel({
          channelId: interaction.member.voice.channel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        await queue.playSong(connection);
      }
    } catch (error) {
      await interaction.reply(`Error: ${error.message}`);
    }
  },
};