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
    // Validate configuration
    validateConfig();

    // Create logs directory
    await mkdir(join(__dirname, '../logs'), { recursive: true });

    // Initialize Discord client
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ],
      failIfNotExists: false,
      retryLimit: 5
    });

    // Initialize collections
    client.commands = new Collection();
    client.musicQueues = new Map();

    // Register commands and load events with retry
    await pRetry(
      async () => {
        await registerCommands();
        loadEvents(client);
      },
      {
        retries: 3,
        onFailedAttempt: error => {
          logger.warn(
            `Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
          );
        }
      }
    );

    // Login to Discord with retry
    await pRetry(
      async () => {
        await client.login(CONFIG.DISCORD_TOKEN);
        logger.info('Bot logged in successfully');
      },
      {
        retries: 5,
        onFailedAttempt: error => {
          logger.warn(
            `Login attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
          );
        }
      }
    );

    // Handle process errors
    process.on('unhandledRejection', (error) => {
      logger.error('Unhandled promise rejection:', error);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to initialize bot:', error);
    process.exit(1);
  }
}

initializeBot();