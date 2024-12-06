import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Display the current music queue'),

  async execute(interaction) {
    const queue = interaction.client.musicQueues.get(interaction.guildId);
    
    if (!queue || !queue.currentSong) {
      return await interaction.reply('No songs are currently playing!');
    }

    const queueEmbed = new EmbedBuilder()
      .setTitle('🎵 Music Queue')
      .setColor('#3498db');

    // Add current song
    queueEmbed.addFields({
      name: 'Now Playing',
      value: `${queue.currentSong.title} [${queue.formatDuration(queue.currentSong.duration)}]`
    });

    // Add queue
    if (queue.queue.length > 0) {
      const queueList = queue.queue
        .slice(0, 10)
        .map((song, index) => 
          `${index + 1}. ${song.title} [${queue.formatDuration(song.duration)}]`
        )
        .join('\n');

      queueEmbed.addFields({
        name: 'Up Next',
        value: queueList
      });

      if (queue.queue.length > 10) {
        queueEmbed.addFields({
          name: 'And...',
          value: `${queue.queue.length - 10} more songs in queue`
        });
      }
    }

    await interaction.reply({ embeds: [queueEmbed] });
  },
};