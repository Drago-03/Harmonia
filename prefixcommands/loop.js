export default {
  name: 'loop',
  description: 'Toggle loop mode',
  async execute(message, args) {
    const queue = message.client.musicQueues.get(message.guild.id);
    
    if (!queue) {
      return await message.reply('Nothing is currently playing!');
    }

    const mode = args[0]?.toLowerCase();
    if (!['off', 'song', 'queue'].includes(mode)) {
      return await message.reply('Invalid loop mode! Use "off", "song", or "queue".');
    }

    queue.setLoopMode(mode);
    await message.reply(`Loop mode set to: ${mode}`);
  },
};