import { AppDataSource } from '../config/db';
import { InterceptorType } from '../Entities';
import { logger } from '../utils/logger';

export const getInterceptorTypeRepository = () => AppDataSource.getRepository(InterceptorType);

export const getAllInterceptorTypes = async (): Promise<InterceptorType[]> => {
  const repo = getInterceptorTypeRepository();
  return repo.find({
    relations: { launcherAmmunition: true },
    order: { id: 'ASC' },
  });
};

export const getInterceptorTypeById = async (id: number): Promise<InterceptorType | null> => {
  const repo = getInterceptorTypeRepository();
  return repo.findOne({
    where: { id },
    relations: { launcherAmmunition: true },
  });
};

export const createInterceptorType = async (
  data: Partial<InterceptorType>
): Promise<InterceptorType> => {
  const repo = getInterceptorTypeRepository();
  const item = repo.create(data);
  const saved = await repo.save(item);
  logger.info(`Created interceptor type with id: ${saved.id}`);
  return saved;
};

export const updateInterceptorType = async (
  id: number,
  data: Partial<InterceptorType>
): Promise<InterceptorType | null> => {
  const repo = getInterceptorTypeRepository();
  const existing = await repo.findOneBy({ id });
  if (!existing) {
    return null;
  }

  if (data.name !== undefined) {
    await repo.update(id, { name: data.name });
  }

  const updated = await repo.findOneBy({ id });
  if (updated) {
    logger.info(`Updated interceptor type with id: ${id}`);
  }
  return updated;
};

export const deleteInterceptorType = async (id: number): Promise<boolean> => {
  const repo = getInterceptorTypeRepository();
  const result = await repo.delete(id);
  const deleted = (result.affected ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted interceptor type with id: ${id}`);
  }
  return deleted;
};
