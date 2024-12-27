import { config } from 'dotenv';
import logger from './logger.js';

config();

const requiredEnvVars = ['DISCORD_TOKEN', 'GENIUS_API_KEY', 'CLIENT_ID', 'GUILD_ID', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];

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
  GUILD_ID: process.env.GUILD_ID,
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  ACTIVITY_APP_ID: process.env.ACTIVITY_APP_ID || '773336526917861400',
  MAX_PARTICIPANTS: {
    DEFAULT: 5,
    PREMIUM: 20
  }
};