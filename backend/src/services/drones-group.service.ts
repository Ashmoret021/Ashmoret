import { AppDataSource } from '../config/db';
import { DronesGroup } from '../Entities';
import { logger } from '../utils/logger';

export const getDronesGroupRepository = () => AppDataSource.getRepository(DronesGroup);

export const getAllDronesGroups = async (): Promise<DronesGroup[]> => {
  const repo = getDronesGroupRepository();
  return repo.find({
    relations: { drones: true, scenarios: true },
    order: { id: 'ASC' },
  });
};

export const getDronesGroupById = async (id: number): Promise<DronesGroup | null> => {
  const repo = getDronesGroupRepository();
  return repo.findOne({
    where: { id },
    relations: { drones: true, scenarios: true },
  });
};

export const createDronesGroup = async (data: Partial<DronesGroup>): Promise<DronesGroup> => {
  const repo = getDronesGroupRepository();
  const group = repo.create(data);
  const saved = await repo.save(group);
  logger.info(`Created drones group with id: ${saved.id}`);
  return saved;
};

export const updateDronesGroup = async (
  id: number,
  data: Partial<DronesGroup>
): Promise<DronesGroup | null> => {
  const repo = getDronesGroupRepository();
  const existing = await repo.findOneBy({ id });
  if (!existing) {
    return null;
  }

  if (data.name !== undefined) {
    await repo.update(id, { name: data.name });
  }

  const updated = await repo.findOneBy({ id });
  if (updated) {
    logger.info(`Updated drones group with id: ${id}`);
  }
  return updated;
};

export const deleteDronesGroup = async (id: number): Promise<boolean> => {
  const repo = getDronesGroupRepository();
  const result = await repo.delete(id);
  const deleted = (result.affected ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted drones group with id: ${id}`);
  }
  return deleted;
};
