import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the current queue'),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);
    
    if (!queue || queue.queue.length < 2) {
      return await interaction.reply('Not enough songs in the queue to shuffle!');
    }

    queue.shuffle();
    await interaction.reply('🔀 Queue has been shuffled!');
  },
};