import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validateConfig, CONFIG } from './utils/config.js';
import { registerCommands } from './utils/commandHandler.js';
import { loadEvents } from './utils/eventHandler.js';
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
        GatewayIntentBits.GuildMessages
      ],
      failIfNotExists: false,
      retryLimit: 5
    });

    // Initialize collections
    client.commands = new Collection();
    client.musicQueues = new Map();
    client.groups = new Map();
    client.syncSessions = new Map();
    client.sharedContent = new Map();
    client.voteManager = new Map();

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
        await client.login(CONFIG.DISCORD_TOKEN);
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