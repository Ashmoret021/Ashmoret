import { pool } from '../config/db';
import { getTable } from '../config/schema';
import { DroneType, CreateDroneTypeInput, UpdateDroneTypeInput } from '../types/models';

const TABLE_NAME = 'drone_type';

export const getAllDroneTypes = async (): Promise<DroneType[]> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} ORDER BY id ASC`;
  const result = await pool.query<DroneType>(query);
  return result.rows;
};

export const getDroneTypeById = async (id: number): Promise<DroneType | null> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query<DroneType>(query, [id]);
  return result.rows[0] ?? null;
};

export const createDroneType = async (data: CreateDroneTypeInput): Promise<DroneType> => {
  if (data.id !== undefined) {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (id, name)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query<DroneType>(query, [data.id, data.name]);
    return result.rows[0];
  }

  const query = `
    INSERT INTO ${getTable(TABLE_NAME)} (name)
    VALUES ($1)
    RETURNING *
  `;
  const result = await pool.query<DroneType>(query, [data.name]);
  return result.rows[0];
};

export const updateDroneType = async (
  id: number,
  data: UpdateDroneTypeInput
): Promise<DroneType | null> => {
  const allowedKeys: (keyof UpdateDroneTypeInput)[] = ['name'];
  const keysToUpdate = allowedKeys.filter((key) => data[key] !== undefined);

  if (keysToUpdate.length === 0) {
    return getDroneTypeById(id);
  }

  const setClause = keysToUpdate.map((key, index) => `"${key}" = $${index + 2}`).join(', ');
  const values = [id, ...keysToUpdate.map((key) => data[key])];

  const query = `
    UPDATE ${getTable(TABLE_NAME)}
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query<DroneType>(query, values);
  return result.rows[0] ?? null;
};

export const deleteDroneType = async (id: number): Promise<boolean> => {
  const query = `DELETE FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return (result.rowCount ?? 0) > 0;
};
