import { SlashCommandBuilder } from 'discord.js';
import premiumManager from '../utils/Premiummanager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('premium')
    .setDescription('Get premium information and status'),

  async execute(interaction) {
    const prices = premiumManager.getPrices();
    const isUserPremium = premiumManager.isPremiumUser(interaction.user.id);
    const isServerPremium = premiumManager.isPremiumServer(interaction.guildId);

    const embed = {
      title: '🌟 Premium Features',
      description: 'Unlock exclusive features with Premium!',
      fields: [
        {
          name: '💰 Pricing',
          value: `Personal: $${prices.personal}/month\nServer: $${prices.server}/month`
        },
        {
          name: '✨ Features',
          value: '• 24/7 Mode\n• Higher Audio Quality\n• Priority Support'
        },
        {
          name: '📊 Your Status',
          value: `Personal Premium: ${isUserPremium ? '✅' : '❌'}\nServer Premium: ${isServerPremium ? '✅' : '❌'}`
        }
      ],
      color: 0xFFD700
    };

    await interaction.reply({ embeds: [embed] });
  },
};