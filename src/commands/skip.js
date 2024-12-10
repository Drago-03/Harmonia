import { SlashCommandBuilder } from 'discord.js';
import { voteManager } from '../utils/vote.js';

export default {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Vote to skip the current song'),

    async execute(interaction) {
        if (!interaction.member.voice.channel) {
            return await interaction.reply({
                content: 'You need to be in a voice channel!',
                ephemeral: true
            });
        }

        const memberCount = interaction.member.voice.channel.members.size;
        
        // If only one person in VC, skip immediately
        if (memberCount === 1) {
            const queue = interaction.client.musicQueues.get(interaction.guildId);
            if (queue) await queue.skip();
            return await interaction.reply('Skipped the song!');
        }

        // Start or add to vote
        const existingVote = voteManager.getActiveVote(interaction.guildId);
        if (existingVote) {
            voteManager.addVote(interaction.guildId, interaction.user.id);
        } else {
            voteManager.createVote(interaction.guildId, interaction.user.id, 'skip');
        }

        const required = voteManager.getRequiredVotes(memberCount);
        const current = voteManager.getVoters(interaction.guildId).length;

        if (voteManager.hasEnoughVotes(interaction.guildId, memberCount)) {
            const queue = interaction.client.musicQueues.get(interaction.guildId);
            if (queue) await queue.skip();
            voteManager.endVote(interaction.guildId);
            return await interaction.reply('Vote passed! Skipping the song.');
        }

        await interaction.reply(
            `Vote to skip: ${current}/${required} votes ` +
            `(${(voteManager.getRemainingTime(interaction.guildId) / 1000).toFixed(1)}s remaining)`
        );
    },
};