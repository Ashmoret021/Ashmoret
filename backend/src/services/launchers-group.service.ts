import { pool } from '../config/db';
import { getTable } from '../config/schema';
import { LaunchersGroup, CreateLaunchersGroupInput, UpdateLaunchersGroupInput } from '../types/models';

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
  if (data.id !== undefined) {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (id, name)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query<LaunchersGroup>(query, [data.id, data.name]);
    return result.rows[0];
  }

  const query = `
    INSERT INTO ${getTable(TABLE_NAME)} (name)
    VALUES ($1)
    RETURNING *
  `;
  const result = await pool.query<LaunchersGroup>(query, [data.name]);
  return result.rows[0];
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
  return result.rows[0] ?? null;
};

export const deleteLaunchersGroup = async (id: number): Promise<boolean> => {
  const query = `DELETE FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return (result.rowCount ?? 0) > 0;
};
