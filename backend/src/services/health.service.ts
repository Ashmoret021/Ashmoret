import { pool } from '../config/db';

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('Database health check failed:', err);
    return false;
  }
};
