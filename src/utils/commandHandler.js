import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from './logger.js';
import { CONFIG } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function registerCommands() {
  try {
    const commands = [];
    const commandFiles = readdirSync(join(__dirname, '../commands'))
      .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = await import(`../commands/${file}`);
      if (command.default?.data && command.default?.execute) {
        commands.push(command.default.data.toJSON());
        logger.info(`Registered command: ${command.default.data.name}`);
      } else {
        logger.warn(`Invalid command file: ${file}`);
      }
    }

    const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD_TOKEN);

    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    await rest.put(
      Routes.applicationCommands(CONFIG.CLIENT_ID),
      { body: commands }
    );

    logger.info('Successfully registered application commands.');
    return commands;

  } catch (error) {
    logger.error('Failed to register commands:', error);
    throw error;
  }
}