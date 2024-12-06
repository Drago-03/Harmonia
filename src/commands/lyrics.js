import { SlashCommandBuilder } from 'discord.js';
import pkg from 'genius-lyrics';
const { Client: GeniusClient } = pkg;

const genius = new GeniusClient(process.env.GENIUS_API_KEY);

export default {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Get the lyrics of the current song'),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);
    
    if (!queue || !queue.currentSong) {
      return await interaction.reply('No song is currently playing!');
    }

    try {
      const searches = await genius.songs.search(queue.currentSong.title);
      if (searches.length > 0) {
        const song = searches[0];
        const lyrics = await song.lyrics();
        await interaction.reply(`**Lyrics for ${queue.currentSong.title}:**\n${lyrics}`);
      } else {
        await interaction.reply(`No lyrics found for ${queue.currentSong.title}`);
      }
    } catch (error) {
      await interaction.reply(`Error fetching lyrics: ${error.message}`);
    }
  },
};