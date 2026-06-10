import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const dbUrl = isProd ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL_DEV;

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl!,
  },
});
