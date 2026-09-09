import { pool } from '../config/db';
import { getTable } from '../config/schema';
import { Scenario, CreateScenarioInput, UpdateScenarioInput } from '../types/models';

const TABLE_NAME = 'scenario';

export const getAllScenarios = async (): Promise<Scenario[]> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} ORDER BY id ASC`;
  const result = await pool.query<Scenario>(query);
  return result.rows;
};

export const getScenarioById = async (id: string): Promise<Scenario | null> => {
  const query = `SELECT * FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query<Scenario>(query, [id]);
  return result.rows[0] ?? null;
};

export const createScenario = async (data: CreateScenarioInput): Promise<Scenario> => {
  const query = `
    INSERT INTO ${getTable(TABLE_NAME)} (id, name, drones_group_id, launchers_group_id, type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [data.id, data.name, data.drones_group_id, data.launchers_group_id, data.type];
  const result = await pool.query<Scenario>(query, values);
  return result.rows[0];
};

export const updateScenario = async (
  id: string,
  data: UpdateScenarioInput
): Promise<Scenario | null> => {
  const allowedKeys: (keyof UpdateScenarioInput)[] = [
    'name',
    'drones_group_id',
    'launchers_group_id',
    'type',
  ];
  const keysToUpdate = allowedKeys.filter((key) => data[key] !== undefined);

  if (keysToUpdate.length === 0) {
    return getScenarioById(id);
  }

  const setClause = keysToUpdate.map((key, index) => `"${key}" = $${index + 2}`).join(', ');
  const values = [id, ...keysToUpdate.map((key) => data[key])];

  const query = `
    UPDATE ${getTable(TABLE_NAME)}
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query<Scenario>(query, values);
  return result.rows[0] ?? null;
};

export const deleteScenario = async (id: string): Promise<boolean> => {
  const query = `DELETE FROM ${getTable(TABLE_NAME)} WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return (result.rowCount ?? 0) > 0;
};
