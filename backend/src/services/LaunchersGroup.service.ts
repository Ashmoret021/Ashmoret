import { AppDataSource } from '../config/db';
import { LaunchersGroup } from '../Entities';
import { logger } from '../middleware/logger';

export const getLaunchersGroupRepository = () => AppDataSource.getRepository(LaunchersGroup);

export const getAllLaunchersGroups = async (): Promise<LaunchersGroup[]> => {
  const repo = getLaunchersGroupRepository();
  return repo.find({
    relations: { launchers: true, scenarios: true },
    order: { id: 'ASC' },
  });
};

export const getLaunchersGroupById = async (id: number): Promise<LaunchersGroup | null> => {
  const repo = getLaunchersGroupRepository();
  return repo.findOne({
    where: { id },
    relations: { launchers: true, scenarios: true },
  });
};

export const createLaunchersGroup = async (
  data: Partial<LaunchersGroup>
): Promise<LaunchersGroup> => {
  const repo = getLaunchersGroupRepository();
  const group = repo.create(data);
  const saved = await repo.save(group);
  logger.info(`Created launchers group with id: ${saved.id}`);
  return saved;
};

export const updateLaunchersGroup = async (
  id: number,
  data: Partial<LaunchersGroup>
): Promise<LaunchersGroup | null> => {
  const repo = getLaunchersGroupRepository();
  const existing = await repo.findOneBy({ id });
  if (!existing) {
    return null;
  }

  const updatePayload: Partial<LaunchersGroup> = {};
  if (data.name !== undefined) {
    updatePayload.name = data.name;
  }
  if (data.description !== undefined) {
    updatePayload.description = data.description;
  }

  if (Object.keys(updatePayload).length > 0) {
    await repo.update(id, updatePayload);
  }

  const updated = await repo.findOneBy({ id });
  if (updated) {
    logger.info(`Updated launchers group with id: ${id}`);
  }
  return updated;
};

export const deleteLaunchersGroup = async (id: number): Promise<boolean> => {
  const repo = getLaunchersGroupRepository();
  const result = await repo.delete(id);
  const deleted = (result.affected ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted launchers group with id: ${id}`);
  }
  return deleted;
};
