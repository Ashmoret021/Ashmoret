import { AppDataSource } from '../config/db';
import { Launcher } from '../Entities';
import { logger } from '../utils/logger';

export const getLauncherRepository = () => AppDataSource.getRepository(Launcher);

export type LauncherInput = Partial<Launcher> & {
  launchers_group_id?: number;
};

export const getAllLaunchers = async (launchersGroupId?: number): Promise<Launcher[]> => {
  const repo = getLauncherRepository();
  return repo.find({
    where: launchersGroupId !== undefined ? { launchersGroupId } : undefined,
    relations: { launchersGroup: true, launcherType: true, ammunition: true },
    order: { id: 'ASC' },
  });
};

export const getLauncherById = async (id: number): Promise<Launcher | null> => {
  const repo = getLauncherRepository();
  return repo.findOne({
    where: { id },
    relations: { launchersGroup: true, launcherType: true, ammunition: true },
  });
};

export const createLauncher = async (data: LauncherInput): Promise<Launcher> => {
  const repo = getLauncherRepository();
  const launcher = repo.create({
    id: data.id,
    launchersGroupId: data.launchersGroupId ?? data.launchers_group_id,
    longitude: data.longitude,
    latitude: data.latitude,
    asl: data.asl,
    agl: data.agl,
    type: data.type,
    amount: data.amount,
    active: data.active,
  });
  const saved = await repo.save(launcher);
  logger.info(`Created launcher with id: ${saved.id}`);
  return saved;
};

export const updateLauncher = async (
  id: number,
  data: Partial<LauncherInput>
): Promise<Launcher | null> => {
  const repo = getLauncherRepository();
  const existing = await repo.findOneBy({ id });
  if (!existing) {
    return null;
  }

  const updatePayload: Partial<Launcher> = {};
  if (data.launchersGroupId !== undefined || data.launchers_group_id !== undefined) {
    updatePayload.launchersGroupId = data.launchersGroupId ?? data.launchers_group_id;
  }
  if (data.longitude !== undefined) updatePayload.longitude = data.longitude;
  if (data.latitude !== undefined) updatePayload.latitude = data.latitude;
  if (data.asl !== undefined) updatePayload.asl = data.asl;
  if (data.agl !== undefined) updatePayload.agl = data.agl;
  if (data.type !== undefined) updatePayload.type = data.type;
  if (data.amount !== undefined) updatePayload.amount = data.amount;
  if (data.active !== undefined) updatePayload.active = data.active;

  await repo.update(id, updatePayload);
  const updated = await repo.findOneBy({ id });
  if (updated) {
    logger.info(`Updated launcher with id: ${id}`);
  }
  return updated;
};

export const deleteLauncher = async (id: number): Promise<boolean> => {
  const repo = getLauncherRepository();
  const result = await repo.delete(id);
  const deleted = (result.affected ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted launcher with id: ${id}`);
  }
  return deleted;
};
