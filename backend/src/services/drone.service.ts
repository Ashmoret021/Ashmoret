import { pool } from '../config/db';
import { getTable } from '../config/schema';
import { Drone, CreateDroneInput, UpdateDroneInput } from '../types/models';
import { logger } from '../utils/logger';

const TABLE_NAME = 'drone';

export const getAllDrones = async (dronesGroupId?: number): Promise<Drone[]> => {
  if (dronesGroupId !== undefined) {
    const query = `SELECT * FROM ${getTable(TABLE_NAME)} WHERE drones_group_id = $1 ORDER BY id ASC`;
    const result = await pool.query<Drone>(query, [dronesGroupId]);
    return result.rows;
  }

  const query = `SELECT * FROM ${getTable(TABLE_NAME)} ORDER BY id ASC`;
  const result = await pool.query<Drone>(query);
  return result.rows;
};

export const getDroneById = async (id: number): Promise<Drone | null> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query<Drone>(query, [id]);
  return result.rows[0] ?? null;
};

export const createDrone = async (data: CreateDroneInput): Promise<Drone> => {
  let created: Drone;
  if (data.id !== undefined) {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (id, drones_group_id, longitude, latitude, asl, agl, heading, velocity, type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      data.id,
      data.drones_group_id,
      data.longitude,
      data.latitude,
      data.asl,
      data.agl,
      data.heading,
      data.velocity,
      data.type,
    ];
    const result = await pool.query<Drone>(query, values);
    created = result.rows[0];
  } else {
    const query = `
      INSERT INTO ${getTable(TABLE_NAME)} (drones_group_id, longitude, latitude, asl, agl, heading, velocity, type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      data.drones_group_id,
      data.longitude,
      data.latitude,
      data.asl,
      data.agl,
      data.heading,
      data.velocity,
      data.type,
    ];
    const result = await pool.query<Drone>(query, values);
    created = result.rows[0];
  }
  logger.info(`Created drone with id: ${created.id}`);
  return created;
};

export const updateDrone = async (id: number, data: UpdateDroneInput): Promise<Drone | null> => {
  const allowedKeys: (keyof UpdateDroneInput)[] = [
    'drones_group_id',
    'longitude',
    'latitude',
    'asl',
    'agl',
    'heading',
    'velocity',
    'type',
  ];
  const keysToUpdate = allowedKeys.filter((key) => data[key] !== undefined);

  if (keysToUpdate.length === 0) {
    return getDroneById(id);
  }

  const setClause = keysToUpdate.map((key, index) => `"${key}" = $${index + 2}`).join(', ');
  const values = [id, ...keysToUpdate.map((key) => data[key])];

  const query = `
    UPDATE ${getTable(TABLE_NAME)}
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query<Drone>(query, values);
  const updated = result.rows[0] ?? null;
  if (updated) {
    logger.info(`Updated drone with id: ${id}`);
  }
  return updated;
};

export const deleteDrone = async (id: number): Promise<boolean> => {
  const query = `DELETE FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query(query, [id]);
  const deleted = (result.rowCount ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted drone with id: ${id}`);
  }
  return deleted;
};
