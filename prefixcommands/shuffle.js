export default {
  name: 'shuffle',
  description: 'Shuffle the current queue',
  async execute(message) {
    const queue = message.client.musicQueues.get(message.guild.id);
    
    if (!queue || queue.queue.length < 2) {
      return await message.reply('Not enough songs in the queue to shuffle!');
    }

    queue.shuffle();
    await message.reply('🔀 Queue has been shuffled!');
  },
};