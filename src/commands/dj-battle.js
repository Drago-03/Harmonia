import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dj-battle')
    .setDescription('Start a DJ battle')
    .addUserOption(option =>
      option
        .setName('opponent')
        .setDescription('Your opponent')
        .setRequired(true)),

  async execute(interaction) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.bot) {
      return await interaction.reply('You cannot battle against a bot!');
    }

    const battleEmbed = new EmbedBuilder()
      .setTitle('🎵 DJ Battle')
      .setDescription(`${interaction.user.username} vs ${opponent.username}`)
      .addFields(
        { name: 'Round', value: '1/3', inline: true },
        { name: 'Current Turn', value: interaction.user.username, inline: true },
        { name: 'Score', value: '0 - 0', inline: true }
      )
      .setColor('#ff0000');

    const battle = {
      players: [interaction.user.id, opponent.id],
      scores: [0, 0],
      currentRound: 1,
      maxRounds: 3,
      votes: new Map()
    };

    // Store battle data
    interaction.client.battles.set(interaction.guildId, battle);

    await interaction.reply({ embeds: [battleEmbed] });
  }
};