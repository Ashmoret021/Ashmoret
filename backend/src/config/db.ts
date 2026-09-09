import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Pool } from 'pg';
import * as entities from '../Entities';
import { logger } from '../utils/logger';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'pp',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pp',
  schema: process.env.DB_SCHEMA || 'scenario_management',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
  entities: Object.values(entities),
});

export const initializeDatabase = async (): Promise<DataSource> => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    logger.info('Connected to PostgreSQL via TypeORM DataSource');
  }
  return AppDataSource;
};

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
  await initializeDatabase();
};
