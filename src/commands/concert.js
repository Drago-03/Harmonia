import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('concert')
    .setDescription('Start a virtual concert experience'),

  async execute(interaction) {
    if (!interaction.member.voice.channel) {
      return await interaction.reply('You need to be in a voice channel!');
    }

    const concertEmbed = new EmbedBuilder()
      .setTitle('🎭 Virtual Concert')
      .setDescription('Starting virtual concert experience...')
      .addFields(
        { name: 'Stage Effects', value: '✨ Enabled', inline: true },
        { name: 'Crowd Ambience', value: '🔊 Enabled', inline: true },
        { name: 'Light Show', value: '💡 Enabled', inline: true }
      )
      .setColor('#9B59B6');

    // Enable special effects
    const queue = interaction.client.musicQueues.get(interaction.guildId);
    if (queue) {
      queue.concertMode = true;
      queue.enableCrowdSounds = true;
      queue.enableLightShow = true;
    }

    await interaction.reply({ embeds: [concertEmbed] });
  }
};