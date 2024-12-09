import pkg from 'genius-lyrics';
const { Client: GeniusClient } = pkg;

const genius = new GeniusClient(process.env.GENIUS_API_KEY);

export default {
  name: 'lyrics',
  description: 'Get the lyrics of the current song',
  async execute(message) {
    const queue = message.client.musicQueues.get(message.guild.id);
    
    if (!queue || !queue.currentSong) {
      return await message.reply('No song is currently playing!');
    }

    try {
      const searches = await genius.songs.search(queue.currentSong.title);
      if (searches.length > 0) {
        const song = searches[0];
        const lyrics = await song.lyrics();
        await message.reply(`**Lyrics for ${queue.currentSong.title}:**\n${lyrics}`);
      } else {
        await message.reply(`No lyrics found for ${queue.currentSong.title}`);
      }
    } catch (error) {
      await message.reply(`Error fetching lyrics: ${error.message}`);
    }
  },
};