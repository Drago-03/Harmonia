import { config } from 'dotenv';
import logger from './logger.js';

config();

const requiredEnvVars = ['DISCORD_TOKEN', 'GENIUS_API_KEY', 'CLIENT_ID', 'GUILD_ID'];

export function validateConfig() {
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

export const CONFIG = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  GENIUS_API_KEY: process.env.GENIUS_API_KEY,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID
};