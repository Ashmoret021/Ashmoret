import { AppDataSource } from '../config/db';
import { LauncherAmmunition } from '../Entities';
import { logger } from '../middleware/logger';

export const getLauncherAmmunitionRepository = () =>
  AppDataSource.getRepository(LauncherAmmunition);

export type LauncherAmmunitionInput = {
  launcherId?: number;
  launcher_id?: number;
  interceptorTypeId?: number;
  interceptor_type_id?: number;
  amount: number;
};

export const getAllLauncherAmmunition = async (
  launcherId?: number,
  interceptorTypeId?: number
): Promise<LauncherAmmunition[]> => {
  const repo = getLauncherAmmunitionRepository();
  const where: Partial<LauncherAmmunition> = {};
  if (launcherId !== undefined) where.launcherId = launcherId;
  if (interceptorTypeId !== undefined) where.interceptorTypeId = interceptorTypeId;

  return repo.find({
    where,
    relations: { launcher: true, interceptorType: true },
    order: { launcherId: 'ASC', interceptorTypeId: 'ASC' },
  });
};

export const getLauncherAmmunitionById = async (
  launcherId: number,
  interceptorTypeId: number
): Promise<LauncherAmmunition | null> => {
  const repo = getLauncherAmmunitionRepository();
  return repo.findOne({
    where: { launcherId, interceptorTypeId },
    relations: { launcher: true, interceptorType: true },
  });
};

export const createLauncherAmmunition = async (
  data: LauncherAmmunitionInput
): Promise<LauncherAmmunition> => {
  const repo = getLauncherAmmunitionRepository();
  const lId = data.launcherId ?? data.launcher_id;
  const iId = data.interceptorTypeId ?? data.interceptor_type_id;

  if (lId === undefined || iId === undefined) {
    throw new Error('launcherId and interceptorTypeId are required');
  }

  const record = repo.create({
    launcherId: lId,
    interceptorTypeId: iId,
    amount: data.amount,
  });
  const saved = await repo.save(record);
  logger.info(
    `Created launcher ammunition for launcher: ${saved.launcherId}, interceptor: ${saved.interceptorTypeId}`
  );
  return saved;
};

export const updateLauncherAmmunition = async (
  launcherId: number,
  interceptorTypeId: number,
  data: { amount: number }
): Promise<LauncherAmmunition | null> => {
  const repo = getLauncherAmmunitionRepository();
  const existing = await repo.findOneBy({ launcherId, interceptorTypeId });
  if (!existing) {
    return null;
  }

  await repo.update({ launcherId, interceptorTypeId }, { amount: data.amount });
  const updated = await repo.findOneBy({ launcherId, interceptorTypeId });
  if (updated) {
    logger.info(
      `Updated launcher ammunition for launcher: ${launcherId}, interceptor: ${interceptorTypeId}`
    );
  }
  return updated;
};

export const deleteLauncherAmmunition = async (
  launcherId: number,
  interceptorTypeId: number
): Promise<boolean> => {
  const repo = getLauncherAmmunitionRepository();
  const result = await repo.delete({ launcherId, interceptorTypeId });
  const deleted = (result.affected ?? 0) > 0;
  if (deleted) {
    logger.info(
      `Deleted launcher ammunition for launcher: ${launcherId}, interceptor: ${interceptorTypeId}`
    );
  }
  return deleted;
};
