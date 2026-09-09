import { pool } from '../config/db';
import { getTable } from '../config/schema';
import { DroneType, CreateDroneTypeInput, UpdateDroneTypeInput } from '../types/models';
import { logger } from '../utils/logger';

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
  let created: DroneType;
  if (data.id !== undefined) {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (id, name)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query<DroneType>(query, [data.id, data.name]);
    created = result.rows[0];
  } else {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (name)
      VALUES ($1)
      RETURNING *
    `;
    const result = await pool.query<DroneType>(query, [data.name]);
    created = result.rows[0];
  }
  logger.info(`Created drone type with id: ${created.id}`);
  return created;
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
  const updated = result.rows[0] ?? null;
  if (updated) {
    logger.info(`Updated drone type with id: ${id}`);
  }
  return updated;
};

export const deleteDroneType = async (id: number): Promise<boolean> => {
  const query = `DELETE FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query(query, [id]);
  const deleted = (result.rowCount ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted drone type with id: ${id}`);
  }
  return deleted;
};
