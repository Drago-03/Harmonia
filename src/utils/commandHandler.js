import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pRetry from 'p-retry';
import logger from './logger.js';
import { CONFIG } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function registerCommands() {
  try {
    const commands = [];
    const commandFiles = readdirSync(join(__dirname, '../commands')).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = await import(`../commands/${file}`);
      if (command.default?.data) {
        commands.push(command.default.data.toJSON());
      }
    }

    const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD_TOKEN);

    logger.info('Started refreshing application (/) commands.');
    
    await pRetry(
      async () => {
        const result = await rest.put(
          Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID),
          { body: commands }
        );
        logger.info(`Successfully reloaded ${result.length} application (/) commands.`);
        return result;
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
  } catch (error) {
    logger.error('Failed to register commands:', error);
    throw error;
  }
}