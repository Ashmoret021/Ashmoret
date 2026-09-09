import { pool } from '../config/db';
import { getTable } from '../config/schema';
import { DronesGroup, CreateDronesGroupInput, UpdateDronesGroupInput } from '../types/models';
import { logger } from '../utils/logger';

const TABLE_NAME = 'drones_group';

export const getAllDronesGroups = async (): Promise<DronesGroup[]> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} ORDER BY id ASC`;
  const result = await pool.query<DronesGroup>(query);
  return result.rows;
};

export const getDronesGroupById = async (id: number): Promise<DronesGroup | null> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query<DronesGroup>(query, [id]);
  return result.rows[0] ?? null;
};

export const createDronesGroup = async (data: CreateDronesGroupInput): Promise<DronesGroup> => {
  let created: DronesGroup;
  if (data.id !== undefined) {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (id, name)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query<DronesGroup>(query, [data.id, data.name]);
    created = result.rows[0];
  } else {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (name)
      VALUES ($1)
      RETURNING *
    `;
    const result = await pool.query<DronesGroup>(query, [data.name]);
    created = result.rows[0];
  }
  logger.info(`Created drones group with id: ${created.id}`);
  return created;
};

export const updateDronesGroup = async (
  id: number,
  data: UpdateDronesGroupInput
): Promise<DronesGroup | null> => {
  const allowedKeys: (keyof UpdateDronesGroupInput)[] = ['name'];
  const keysToUpdate = allowedKeys.filter((key) => data[key] !== undefined);

  if (keysToUpdate.length === 0) {
    return getDronesGroupById(id);
  }

  const setClause = keysToUpdate.map((key, index) => `"${key}" = $${index + 2}`).join(', ');
  const values = [id, ...keysToUpdate.map((key) => data[key])];

  const query = `
    UPDATE ${getTable(TABLE_NAME)}
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query<DronesGroup>(query, values);
  const updated = result.rows[0] ?? null;
  if (updated) {
    logger.info(`Updated drones group with id: ${id}`);
  }
  return updated;
};

export const deleteDronesGroup = async (id: number): Promise<boolean> => {
  const query = `DELETE FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query(query, [id]);
  const deleted = (result.rowCount ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted drones group with id: ${id}`);
  }
  return deleted;
};
