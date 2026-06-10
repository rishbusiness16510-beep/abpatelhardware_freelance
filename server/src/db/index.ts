import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';

// Node 21+ has native global WebSocket
neonConfig.webSocketConstructor = globalThis.WebSocket;
import * as schema from './schema.js';
import * as dotenv from 'dotenv';
import { logger } from '../lib/logger.js';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const dbUrl = process.env.DATABASE_URL || (isProd ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL_DEV);

if (!dbUrl) {
  logger.error('Database', 'Connection URL is not defined', { env: isProd ? 'production' : 'development' });
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Mask the URL for logging (show host only)
const maskedUrl = dbUrl.replace(/\/\/.*@/, '//***@');
logger.info('Database', 'Initializing connection', { target: maskedUrl, env: isProd ? 'production' : 'development' });

const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle(pool, { schema });

// Verify connection by running a simple query
(async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Database', '✓ Connected successfully', { env: isProd ? 'production' : 'development' });
  } catch (error: any) {
    logger.error('Database', '✗ Connection failed', { error: error.message });
  }
})();
