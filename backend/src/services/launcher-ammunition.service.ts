import { pool } from '../config/db';
import { getTable } from '../config/schema';
import {
  LauncherAmmunition,
  CreateLauncherAmmunitionInput,
  UpdateLauncherAmmunitionInput,
} from '../types/models';

const TABLE_NAME = 'launcher_ammunition';

export const getAllLauncherAmmunition = async (
  launcherId?: number,
  interceptorTypeId?: number
): Promise<LauncherAmmunition[]> => {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (launcherId !== undefined) {
    values.push(launcherId);
    conditions.push(`launcher_id = $${values.length}`);
  }

  if (interceptorTypeId !== undefined) {
    values.push(interceptorTypeId);
    conditions.push(`interceptor_type_id = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT * FROM ${getTable(TABLE_NAME)}
    ${whereClause}
    ORDER BY launcher_id ASC, interceptor_type_id ASC
  `;

  const result = await pool.query<LauncherAmmunition>(query, values);
  return result.rows;
};

export const getLauncherAmmunitionById = async (
  launcherId: number,
  interceptorTypeId: number
): Promise<LauncherAmmunition | null> => {
  const query = `
    SELECT * FROM ${getTable(TABLE_NAME)}
    WHERE launcher_id = $1 AND interceptor_type_id = $2
  `;
  const result = await pool.query<LauncherAmmunition>(query, [launcherId, interceptorTypeId]);
  return result.rows[0] ?? null;
};

export const createLauncherAmmunition = async (
  data: CreateLauncherAmmunitionInput
): Promise<LauncherAmmunition> => {
  const query = `
    INSERT INTO ${getTable(TABLE_NAME)} (launcher_id, interceptor_type_id, amount)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await pool.query<LauncherAmmunition>(query, [
    data.launcher_id,
    data.interceptor_type_id,
    data.amount,
  ]);
  return result.rows[0];
};

export const updateLauncherAmmunition = async (
  launcherId: number,
  interceptorTypeId: number,
  data: UpdateLauncherAmmunitionInput
): Promise<LauncherAmmunition | null> => {
  const query = `
    UPDATE ${getTable(TABLE_NAME)}
    SET amount = $3
    WHERE launcher_id = $1 AND interceptor_type_id = $2
    RETURNING *
  `;
  const result = await pool.query<LauncherAmmunition>(query, [
    launcherId,
    interceptorTypeId,
    data.amount,
  ]);
  return result.rows[0] ?? null;
};

export const deleteLauncherAmmunition = async (
  launcherId: number,
  interceptorTypeId: number
): Promise<boolean> => {
  const query = `
    DELETE FROM ${getTable(TABLE_NAME)}
    WHERE launcher_id = $1 AND interceptor_type_id = $2
  `;
  const result = await pool.query(query, [launcherId, interceptorTypeId]);
  return (result.rowCount ?? 0) > 0;
};
