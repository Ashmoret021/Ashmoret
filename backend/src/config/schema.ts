export const DB_SCHEMA = process.env.DB_SCHEMA ?? 'scenario_management';

export const getTable = (tableName: string): string => {
  return DB_SCHEMA ? `"${DB_SCHEMA}"."${tableName}"` : `"${tableName}"`;
};
