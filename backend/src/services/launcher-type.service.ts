import { pool } from '../config/db';
import { getTable } from '../config/schema';
import { LauncherType, CreateLauncherTypeInput, UpdateLauncherTypeInput } from '../types/models';

const TABLE_NAME = 'launcher_type';

export const getAllLauncherTypes = async (): Promise<LauncherType[]> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} ORDER BY id ASC`;
  const result = await pool.query<LauncherType>(query);
  return result.rows;
};

export const getLauncherTypeById = async (id: number): Promise<LauncherType | null> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query<LauncherType>(query, [id]);
  return result.rows[0] ?? null;
};

export const createLauncherType = async (
  data: CreateLauncherTypeInput
): Promise<LauncherType> => {
  if (data.id !== undefined) {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (id, name, reload_time)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query<LauncherType>(query, [data.id, data.name, data.reload_time]);
    return result.rows[0];
  }

  const query = `
    INSERT INTO ${getTable(TABLE_NAME)} (name, reload_time)
    VALUES ($1, $2)
    RETURNING *
  `;
  const result = await pool.query<LauncherType>(query, [data.name, data.reload_time]);
  return result.rows[0];
};

export const updateLauncherType = async (
  id: number,
  data: UpdateLauncherTypeInput
): Promise<LauncherType | null> => {
  const allowedKeys: (keyof UpdateLauncherTypeInput)[] = ['name', 'reload_time'];
  const keysToUpdate = allowedKeys.filter((key) => data[key] !== undefined);

  if (keysToUpdate.length === 0) {
    return getLauncherTypeById(id);
  }

  const setClause = keysToUpdate.map((key, index) => `"${key}" = $${index + 2}`).join(', ');
  const values = [id, ...keysToUpdate.map((key) => data[key])];

  const query = `
    UPDATE ${getTable(TABLE_NAME)}
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query<LauncherType>(query, values);
  return result.rows[0] ?? null;
};

export const deleteLauncherType = async (id: number): Promise<boolean> => {
  const query = `DELETE FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return (result.rowCount ?? 0) > 0;
};
