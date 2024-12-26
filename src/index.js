import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validateConfig, CONFIG } from './utils/config.js';
import { registerCommands } from './utils/commandHandler.js';
import { loadEvents } from './utils/eventHandler.js';
import logger from './utils/logger.js';
import pRetry from 'p-retry';
import config from './config/config.json';

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
      ],
      failIfNotExists: false,
      retryLimit: 5
    });

    // Initialize collections
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file)).default;
      client.commands.set(command.data.name, command);
    }

    client.once('ready', () => {
      console.log('Bot is ready!');
    });

    client.on('interactionCreate', async interaction => {
      if (!interaction.isCommand()) return;

      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    });

    // Register commands and load events with retry
    await pRetry(
      async () => {
        await registerCommands();
        loadEvents(client);
        logger.info('Commands and events loaded successfully');
      },
      {
        retries: 3,
        onFailedAttempt: error => {
          logger.warn(
            `Registration attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
          );
        }
      }
    );

    // Login to Discord
    await pRetry(
      async () => {
        await client.login(config.token);
        logger.info(`Bot logged in as ${client.user.tag}`);
        logger.info(`Loaded ${client.commands.size} commands`);
        logger.info(`Active in ${client.guilds.cache.size} servers`);
      },
      {
        retries: 5,
        onFailedAttempt: error => {
          logger.error('Login failed:', error);
        }
      }
    );

    // Error handling
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