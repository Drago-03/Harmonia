import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playing music and clear the queue'),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);
    
    if (!queue) {
      return await interaction.reply('There is nothing playing!');
    }

    queue.stop();
    interaction.client.musicQueues.delete(interaction.guildId);
    await interaction.reply('Stopped the music and cleared the queue!');
  },
};