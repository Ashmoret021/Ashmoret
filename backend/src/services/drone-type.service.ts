import { AppDataSource } from '../config/db';
import { DroneType } from '../Entities';
import { logger } from '../utils/logger';

export const getDroneTypeRepository = () => AppDataSource.getRepository(DroneType);

export const getAllDroneTypes = async (): Promise<DroneType[]> => {
  const repo = getDroneTypeRepository();
  return repo.find({
    relations: { drones: true },
    order: { id: 'ASC' },
  });
};

export const getDroneTypeById = async (id: number): Promise<DroneType | null> => {
  const repo = getDroneTypeRepository();
  return repo.findOne({
    where: { id },
    relations: { drones: true },
  });
};

export const createDroneType = async (data: Partial<DroneType>): Promise<DroneType> => {
  const repo = getDroneTypeRepository();
  const item = repo.create(data);
  const saved = await repo.save(item);
  logger.info(`Created drone type with id: ${saved.id}`);
  return saved;
};

export const updateDroneType = async (
  id: number,
  data: Partial<DroneType>
): Promise<DroneType | null> => {
  const repo = getDroneTypeRepository();
  const existing = await repo.findOneBy({ id });
  if (!existing) {
    return null;
  }

  if (data.name !== undefined) {
    await repo.update(id, { name: data.name });
  }

  const updated = await repo.findOneBy({ id });
  if (updated) {
    logger.info(`Updated drone type with id: ${id}`);
  }
  return updated;
};

export const deleteDroneType = async (id: number): Promise<boolean> => {
  const repo = getDroneTypeRepository();
  const result = await repo.delete(id);
  const deleted = (result.affected ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted drone type with id: ${id}`);
  }
  return deleted;
};
