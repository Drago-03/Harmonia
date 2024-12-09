export default {
  name: 'volume',
  description: 'Set the volume of the bot (0-200)',
  async execute(message, args) {
    const queue = message.client.musicQueues.get(message.guild.id);
    
    if (!queue) {
      return await message.reply('There is nothing playing!');
    }

    const volume = parseInt(args[0], 10);
    if (isNaN(volume) || volume < 0 || volume > 200) {
      return await message.reply('Volume must be a number between 0 and 200.');
    }

    try {
      queue.setVolume(volume);
      await message.reply(`Volume set to ${volume}%`);
    } catch (error) {
      await message.reply(`Error: ${error.message}`);
    }
  },
};