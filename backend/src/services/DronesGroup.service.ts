import { AppDataSource } from '../config/db';
import { DronesGroup, Drone } from '../Entities';
import { logger } from '../middleware/logger';

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

export const createDronesGroupWithDrones = async (data: {
  name?: string;
  description?: string;
  drones?: Array<Partial<Drone> & {
    drones_group_id?: number;
    longitude?: number;
    latitude?: number;
    asl?: number;
    agl?: number;
    heading?: number;
    velocity?: number;
    type?: number;
  }>;
}): Promise<{ group: DronesGroup; drones: Drone[] }> => {
  const repo = getDronesGroupRepository();

  const result = await AppDataSource.transaction(async (manager) => {
    const groupRepo = manager.getRepository(DronesGroup);
    const droneRepo = manager.getRepository(Drone);

    const name = String(data.name ?? 'Unnamed attack').trim();
    const description = data.description ?? null;

    const groupEntity = groupRepo.create({
      name,
      description: description?.trim() ? description.trim() : undefined,
    });

    const group = await groupRepo.save(groupEntity);

    const incomingDrones = Array.isArray(data.drones) ? data.drones : [];
    const savedDrones = incomingDrones.length
      ? await droneRepo.save(
          incomingDrones.map((droneData) => {
            const normalizedType = Number(droneData.type ?? 1);
            const normalizedLongitude = Number(droneData.longitude ?? 0);
            const normalizedLatitude = Number(droneData.latitude ?? 0);
            const normalizedAsl = Number(droneData.asl ?? droneData.agl ?? 100);
            const normalizedAgl = Number(droneData.agl ?? droneData.asl ?? 100);
            const normalizedHeading = Number(droneData.heading ?? 0);
            const normalizedVelocity = Number(droneData.velocity ?? 60);

            return droneRepo.create({
              dronesGroupId: group.id,
              longitude: normalizedLongitude,
              latitude: normalizedLatitude,
              asl: normalizedAsl,
              agl: normalizedAgl,
              heading: Number.isFinite(normalizedHeading) ? normalizedHeading : 0,
              velocity: Number.isFinite(normalizedVelocity) ? normalizedVelocity : 60,
              type: Number.isFinite(normalizedType) ? normalizedType : 1,
            });
          }),
        )
      : [];

    logger.info(`Created drones group with id: ${group.id} and ${savedDrones.length} drone rows`);

    return { group, drones: savedDrones };
  });

  return result;
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

  const updatePayload: Partial<DronesGroup> = {};
  if (data.name !== undefined) {
    updatePayload.name = data.name;
  }
  if (data.description !== undefined) {
    updatePayload.description = data.description;
  }

  if (Object.keys(updatePayload).length > 0) {
    await repo.update(id, updatePayload as any);
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
