import { joinVoiceChannel } from '@discordjs/voice';
import { MusicPlayer } from '../utils/MusicPlayer.js';

export default {
  name: 'play',
  description: 'Play a song',

  async execute(message, args) {
    const query = args.join(' ');

    if (!message.member.voice.channel) {
      return await message.reply('You need to be in a voice channel!');
    }

    let queue = message.client.musicQueues.get(message.guild.id);
    
    if (!queue) {
      queue = new MusicPlayer();
      message.client.musicQueues.set(message.guild.id, queue);
    }

    try {
      const song = await queue.addSong(query, message.author.id);
      await message.reply(`Added to queue: ${song.title}`);

      if (!queue.currentSong) {
        const connection = joinVoiceChannel({
          channelId: message.member.voice.channel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
        });

        await queue.playSong(connection);
      }
    } catch (error) {
      await message.reply(`Error: ${error.message}`);
    }
  },
};