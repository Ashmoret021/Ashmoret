import { pool } from '../config/db';
import { getTable } from '../config/schema';
import { Launcher, CreateLauncherInput, UpdateLauncherInput } from '../types/models';
import { logger } from '../utils/logger';

const TABLE_NAME = 'launcher';

export const getAllLaunchers = async (launchersGroupId?: number): Promise<Launcher[]> => {
  if (launchersGroupId !== undefined) {
    const query = `SELECT * FROM ${getTable(TABLE_NAME)} WHERE launchers_group_id = $1 ORDER BY id ASC`;
    const result = await pool.query<Launcher>(query, [launchersGroupId]);
    return result.rows;
  }

  const query = `SELECT * FROM ${getTable(TABLE_NAME)} ORDER BY id ASC`;
  const result = await pool.query<Launcher>(query);
  return result.rows;
};

export const getLauncherById = async (id: number): Promise<Launcher | null> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query<Launcher>(query, [id]);
  return result.rows[0] ?? null;
};

export const createLauncher = async (data: CreateLauncherInput): Promise<Launcher> => {
  let created: Launcher;
  if (data.id !== undefined) {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (id, launchers_group_id, longitude, latitude, asl, agl, type, amount, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      data.id,
      data.launchers_group_id,
      data.longitude,
      data.latitude,
      data.asl,
      data.agl,
      data.type,
      data.amount,
      data.active,
    ];
    const result = await pool.query<Launcher>(query, values);
    created = result.rows[0];
  } else {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (launchers_group_id, longitude, latitude, asl, agl, type, amount, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      data.launchers_group_id,
      data.longitude,
      data.latitude,
      data.asl,
      data.agl,
      data.type,
      data.amount,
      data.active,
    ];
    const result = await pool.query<Launcher>(query, values);
    created = result.rows[0];
  }
  logger.info(`Created launcher with id: ${created.id}`);
  return created;
};

export const updateLauncher = async (
  id: number,
  data: UpdateLauncherInput
): Promise<Launcher | null> => {
  const allowedKeys: (keyof UpdateLauncherInput)[] = [
    'launchers_group_id',
    'longitude',
    'latitude',
    'asl',
    'agl',
    'type',
    'amount',
    'active',
  ];
  const keysToUpdate = allowedKeys.filter((key) => data[key] !== undefined);

  if (keysToUpdate.length === 0) {
    return getLauncherById(id);
  }

  const setClause = keysToUpdate.map((key, index) => `"${key}" = $${index + 2}`).join(', ');
  const values = [id, ...keysToUpdate.map((key) => data[key])];

  const query = `
    UPDATE ${getTable(TABLE_NAME)}
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query<Launcher>(query, values);
  const updated = result.rows[0] ?? null;
  if (updated) {
    logger.info(`Updated launcher with id: ${id}`);
  }
  return updated;
};

export const deleteLauncher = async (id: number): Promise<boolean> => {
  const query = `DELETE FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query(query, [id]);
  const deleted = (result.rowCount ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted launcher with id: ${id}`);
  }
  return deleted;
};
