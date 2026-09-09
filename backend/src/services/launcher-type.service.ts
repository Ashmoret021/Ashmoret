import { AppDataSource } from '../config/db';
import { LauncherType } from '../Entities';
import { logger } from '../middleware/logger';

export const getLauncherTypeRepository = () => AppDataSource.getRepository(LauncherType);

export type LauncherTypeInput = Partial<LauncherType> & {
  reloadTime?: number;
};

export const getAllLauncherTypes = async (): Promise<LauncherType[]> => {
  const repo = getLauncherTypeRepository();
  return repo.find({
    relations: { launchers: true },
    order: { id: 'ASC' },
  });
};

export const getLauncherTypeById = async (id: number): Promise<LauncherType | null> => {
  const repo = getLauncherTypeRepository();
  return repo.findOne({
    where: { id },
    relations: { launchers: true },
  });
};

export const createLauncherType = async (data: LauncherTypeInput): Promise<LauncherType> => {
  const repo = getLauncherTypeRepository();
  const reloadTime = data.reload_time ?? data.reloadTime;
  if (reloadTime === undefined) {
    throw new Error('reload_time is required');
  }

  const item = repo.create({
    id: data.id,
    name: data.name,
    reload_time: reloadTime,
  });
  const saved = await repo.save(item);
  logger.info(`Created launcher type with id: ${saved.id}`);
  return saved;
};

export const updateLauncherType = async (
  id: number,
  data: Partial<LauncherTypeInput>
): Promise<LauncherType | null> => {
  const repo = getLauncherTypeRepository();
  const existing = await repo.findOneBy({ id });
  if (!existing) {
    return null;
  }

  const updatePayload: Partial<LauncherType> = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.reload_time !== undefined || data.reloadTime !== undefined) {
    updatePayload.reload_time = data.reload_time ?? data.reloadTime;
  }

  await repo.update(id, updatePayload);
  const updated = await repo.findOneBy({ id });
  if (updated) {
    logger.info(`Updated launcher type with id: ${id}`);
  }
  return updated;
};

export const deleteLauncherType = async (id: number): Promise<boolean> => {
  const repo = getLauncherTypeRepository();
  const result = await repo.delete(id);
  const deleted = (result.affected ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted launcher type with id: ${id}`);
  }
  return deleted;
};
