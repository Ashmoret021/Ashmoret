import { pool } from '../config/db';
import { getTable } from '../config/schema';
import { InterceptorType, CreateInterceptorTypeInput, UpdateInterceptorTypeInput } from '../types/models';

const TABLE_NAME = 'interceptor_type';

export const getAllInterceptorTypes = async (): Promise<InterceptorType[]> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} ORDER BY id ASC`;
  const result = await pool.query<InterceptorType>(query);
  return result.rows;
};

export const getInterceptorTypeById = async (id: number): Promise<InterceptorType | null> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query<InterceptorType>(query, [id]);
  return result.rows[0] ?? null;
};

export const createInterceptorType = async (
  data: CreateInterceptorTypeInput
): Promise<InterceptorType> => {
  if (data.id !== undefined) {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (id, name)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query<InterceptorType>(query, [data.id, data.name]);
    return result.rows[0];
  }

  const query = `
    INSERT INTO ${getTable(TABLE_NAME)} (name)
    VALUES ($1)
    RETURNING *
  `;
  const result = await pool.query<InterceptorType>(query, [data.name]);
  return result.rows[0];
};

export const updateInterceptorType = async (
  id: number,
  data: UpdateInterceptorTypeInput
): Promise<InterceptorType | null> => {
  const allowedKeys: (keyof UpdateInterceptorTypeInput)[] = ['name'];
  const keysToUpdate = allowedKeys.filter((key) => data[key] !== undefined);

  if (keysToUpdate.length === 0) {
    return getInterceptorTypeById(id);
  }

  const setClause = keysToUpdate.map((key, index) => `"${key}" = $${index + 2}`).join(', ');
  const values = [id, ...keysToUpdate.map((key) => data[key])];

  const query = `
    UPDATE ${getTable(TABLE_NAME)}
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query<InterceptorType>(query, values);
  return result.rows[0] ?? null;
};

export const deleteInterceptorType = async (id: number): Promise<boolean> => {
  const query = `DELETE FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return (result.rowCount ?? 0) > 0;
};
