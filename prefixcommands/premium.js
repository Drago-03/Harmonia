import premiumManager from '../utils/PremiumManager.js';

export default {
  name: 'premium',
  description: 'Get premium information and status',
  async execute(message) {
    const prices = premiumManager.getPrices();
    const isUserPremium = premiumManager.isPremiumUser(message.author.id);
    const isServerPremium = premiumManager.isPremiumServer(message.guild.id);

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

    await message.reply({ embeds: [embed] });
  },
};