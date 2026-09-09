import { pool } from '../config/db';
import { getTable } from '../config/schema';
import { LaunchersGroup, CreateLaunchersGroupInput, UpdateLaunchersGroupInput } from '../types/models';
import { logger } from '../utils/logger';

const TABLE_NAME = 'launchers_group';

export const getAllLaunchersGroups = async (): Promise<LaunchersGroup[]> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} ORDER BY id ASC`;
  const result = await pool.query<LaunchersGroup>(query);
  return result.rows;
};

export const getLaunchersGroupById = async (id: number): Promise<LaunchersGroup | null> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query<LaunchersGroup>(query, [id]);
  return result.rows[0] ?? null;
};

export const createLaunchersGroup = async (
  data: CreateLaunchersGroupInput
): Promise<LaunchersGroup> => {
  let created: LaunchersGroup;
  if (data.id !== undefined) {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (id, name)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query<LaunchersGroup>(query, [data.id, data.name]);
    created = result.rows[0];
  } else {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (name)
      VALUES ($1)
      RETURNING *
    `;
    const result = await pool.query<LaunchersGroup>(query, [data.name]);
    created = result.rows[0];
  }
  logger.info(`Created launchers group with id: ${created.id}`);
  return created;
};

export const updateLaunchersGroup = async (
  id: number,
  data: UpdateLaunchersGroupInput
): Promise<LaunchersGroup | null> => {
  const allowedKeys: (keyof UpdateLaunchersGroupInput)[] = ['name'];
  const keysToUpdate = allowedKeys.filter((key) => data[key] !== undefined);

  if (keysToUpdate.length === 0) {
    return getLaunchersGroupById(id);
  }

  const setClause = keysToUpdate.map((key, index) => `"${key}" = $${index + 2}`).join(', ');
  const values = [id, ...keysToUpdate.map((key) => data[key])];

  const query = `
    UPDATE ${getTable(TABLE_NAME)}
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query<LaunchersGroup>(query, values);
  const updated = result.rows[0] ?? null;
  if (updated) {
    logger.info(`Updated launchers group with id: ${id}`);
  }
  return updated;
};

export const deleteLaunchersGroup = async (id: number): Promise<boolean> => {
  const query = `DELETE FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query(query, [id]);
  const deleted = (result.rowCount ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted launchers group with id: ${id}`);
  }
  return deleted;
};
