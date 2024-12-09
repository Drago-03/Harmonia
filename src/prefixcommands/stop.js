export default {
  name: 'stop',
  description: 'Stop playing music and clear the queue',
  async execute(message) {
    const queue = message.client.musicQueues.get(message.guild.id);
    
    if (!queue) {
      return await message.reply('There is nothing playing!');
    }

    queue.stop();
    message.client.musicQueues.delete(message.guild.id);
    await message.reply('Stopped the music and cleared the queue!');
  },
};