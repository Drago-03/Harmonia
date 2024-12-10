import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

export class ProgressBar {
    constructor(queue, message) {
        this.queue = queue;
        this.message = message;
        this.interval = null;
        this.components = [];
        this.isActive = false;
        this.TOTAL_SEGMENTS = 20;
    }

    async create() {
        if (!this.queue.currentSong) return;
        this.isActive = true;

        const initialEmbed = this.createEmbed();
        const components = this.createComponents();

        this.message = await this.message.channel.send({
            embeds: [initialEmbed],
            components: components
        });

        this.startUpdate();
        this.handleInteractions();
    }

    createEmbed() {
        const { currentSong } = this.queue;
        const elapsed = this.queue.getPlaybackTime();
        const duration = currentSong.duration;
        const progress = Math.min(elapsed / duration, 1);
        const segmentsFilled = Math.floor(progress * this.TOTAL_SEGMENTS);

        const progressBar = this.generateProgressBar(segmentsFilled);
        const timestamp = this.formatTime(elapsed) + ' / ' + this.formatTime(duration);

        return {
            color: 0x3498db,
            author: {
                name: '🎵 Now Playing',
                iconURL: this.message.client.user.displayAvatarURL()
            },
            description: [
                `**${currentSong.title}**`,
                '',
                progressBar,
                '',
                timestamp
            ].join('\n'),
            footer: {
                text: '💡 Click/Tap on the bar to seek • Use buttons to control'
            }
        };
    }

    generateProgressBar(filled) {
        const segments = {
            start: { empty: '╶', filled: '╸' },
            middle: { empty: '━', filled: '━' },
            slider: '⚪',
            empty: '┅',
            filled: '━'
        };

        let bar = '';
        for (let i = 0; i < this.TOTAL_SEGMENTS; i++) {
            if (i === filled) {
                bar += segments.slider;
            } else if (i < filled) {
                bar += segments.filled;
            } else {
                bar += segments.empty;
            }
        }

        return `\`${bar}\``;
    }

    createComponents() {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rewind')
                .setEmoji('⏪')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('pause')
                .setEmoji(this.queue.isPaused ? '▶️' : '⏸️')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('forward')
                .setEmoji('⏩')
                .setStyle(ButtonStyle.Secondary)
        );

        const seekRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('seek_bar')
                .setLabel('▂▃▄▅▆▇█▇▆▅▄▃▂')
                .setStyle(ButtonStyle.Secondary)
        );

        return [row, seekRow];
    }

    handleInteractions() {
        const collector = this.message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: this.queue.currentSong.duration * 1000
        });

        collector.on('collect', async (interaction) => {
            if (!this.queue.currentSong) return;

            switch (interaction.customId) {
                case 'pause':
                    this.queue.togglePlayback();
                    break;
                case 'rewind':
                    this.queue.seek(Math.max(0, this.queue.getPlaybackTime() - 10));
                    break;
                case 'forward':
                    this.queue.seek(Math.min(this.queue.currentSong.duration, 
                                           this.queue.getPlaybackTime() + 10));
                    break;
                case 'seek_bar':
                    const clickPosition = this.calculateClickPosition(interaction);
                    const seekTime = Math.floor(clickPosition * this.queue.currentSong.duration);
                    this.queue.seek(seekTime);
                    break;
            }

            await interaction.update({
                embeds: [this.createEmbed()],
                components: this.createComponents()
            });
        });

        collector.on('end', () => {
            this.destroy();
        });
    }

    calculateClickPosition(interaction) {
        // For mobile, calculate based on touch position
        if (interaction.message.interaction) {
            const touchX = interaction.message.interaction.x;
            const messageWidth = interaction.message.embeds[0].description.length;
            return Math.min(1, Math.max(0, touchX / messageWidth));
        }

        // For desktop, calculate based on button width segments
        const buttonWidth = this.TOTAL_SEGMENTS;
        const clickX = Math.floor(interaction.x / (interaction.message.width / buttonWidth));
        return Math.min(1, Math.max(0, clickX / buttonWidth));
    }

    startUpdate() {
        this.interval = setInterval(async () => {
            if (!this.isActive || !this.queue.currentSong) {
                this.destroy();
                return;
            }

            await this.message.edit({
                embeds: [this.createEmbed()],
                components: this.createComponents()
            }).catch(() => this.destroy());
        }, 1000);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    destroy() {
        this.isActive = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}