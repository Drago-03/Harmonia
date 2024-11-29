import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { registerCommands } from './utils/commandHandler.js';
import { loadEvents } from './utils/eventHandler.js';

config();

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
await registerCommands();
loadEvents(client);

client.login(process.env.DISCORD_TOKEN);