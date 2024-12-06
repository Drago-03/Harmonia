import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { registerCommands } from './utils/commandHandler.js';
import { loadEvents } from './utils/eventHandler.js';
import logger from './utils/logger.js';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

config();

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'GENIUS_API_KEY', 'CLIENT_ID', 'GUILD_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create logs directory if it doesn't exist
try {
  await mkdir(join(__dirname, '../logs'), { recursive: true });
} catch (error) {
  logger.error('Failed to create logs directory:', error);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
client.musicQueues = new Map();

// Initialize commands and events
try {
  await registerCommands();
  loadEvents(client);
  logger.info('Commands and events registered successfully');
} catch (error) {
  logger.error('Failed to initialize commands and events:', error);
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    logger.info('Bot logged in successfully');
  })
  .catch(error => {
    logger.error('Failed to login:', error);
    process.exit(1);
  });