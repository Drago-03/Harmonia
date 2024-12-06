import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the volume of the bot (0-200)')
    .addIntegerOption(option =>
      option
        .setName('level')
        .setDescription('Volume level')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(200)),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);
    
    if (!queue) {
      return await interaction.reply('There is nothing playing!');
    }

    const volume = interaction.options.getInteger('level');
    
    try {
      queue.setVolume(volume);
      await interaction.reply(`Volume set to ${volume}%`);
    } catch (error) {
      await interaction.reply(`Error: ${error.message}`);
    }
  },
};