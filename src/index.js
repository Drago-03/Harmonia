import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validateConfig, CONFIG } from './utils/config.js';
import { registerCommands } from './utils/commandHandler.js';
import logger from './utils/logger.js';
import pRetry from 'p-retry';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function initializeBot() {
  try {
    validateConfig();
    await mkdir(join(__dirname, '../logs'), { recursive: true });

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
      ]
    });

    client.commands = new Collection();

    client.once('ready', () => {
      logger.info('Bot is ready!');
    });

    client.on('interactionCreate', async interaction => {
      if (!interaction.isCommand()) return;

      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        logger.error('Command execution error:', error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    });

    await pRetry(
      async () => {
        await registerCommands(client);
        logger.info('Commands and events loaded successfully');
      },
      {
        retries: 3,
        onFailedAttempt: error => {
          logger.warn(`Registration attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
        }
      }
    );

    await pRetry(
      async () => {
        await client.login(CONFIG.DISCORD_TOKEN);
        logger.info(`Bot logged in as ${client.user.tag}`);
        logger.info(`Loaded ${client.commands.size} commands`);
        logger.info(`Active in ${client.guilds.cache.size} servers`);
      },
      {
        retries: 5,
        onFailedAttempt: error => {
          logger.warn(`Login attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
        }
      }
    );

    client.on('error', error => {
      logger.error('Client error:', error);
    });

    process.on('unhandledRejection', error => {
      logger.error('Unhandled promise rejection:', error);
    });

    process.on('uncaughtException', error => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to initialize bot:', error);
    process.exit(1);
  }
}

initializeBot();