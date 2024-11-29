/**
 * Discord Music Bot with Synchronized Lyrics
 * @author Drago
 * @version 1.0.0
 */

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config();

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'GENIUS_API_KEY', 'CLIENT_ID', 'GUILD_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in the .env file`);
    process.exit(1);
  }
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

// Load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(filePath);
  
  if ('data' in command.default && 'execute' in command.default) {
    client.commands.set(command.default.data.name, command.default);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Load events
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);
  const event = await import(filePath);
  
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args));
  }
}

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Failed to login to Discord:', error);
  process.exit(1);
});