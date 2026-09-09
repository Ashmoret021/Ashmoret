import { Pool } from 'pg';
import 'dotenv/config';
import { logger } from '../utils/logger';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

pool.on('connect', () => {
  logger.debug('New client connected to PostgreSQL pool');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', { error: err });
  process.exit(1);
});

export const testConnection = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    logger.info('Connected to PostgreSQL successfully');
  } catch (err) {
    logger.error('Failed to connect to PostgreSQL', { error: err });
    throw err;
  } finally {
    client.release();
  }
};
