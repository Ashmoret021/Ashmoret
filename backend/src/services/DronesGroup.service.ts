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
            // scenario.drone.start_time is NOT NULL with no default — the
            // frontend attack-side builder doesn't send a per-drone start
            // time, so we default to 0 (relative to scenario start).
            const rawStartTime = (droneData as { startTime?: number; start_time?: number }).startTime
              ?? (droneData as { startTime?: number; start_time?: number }).start_time;
            const normalizedStartTime = Number(rawStartTime ?? 0);

            return droneRepo.create({
              dronesGroupId: group.id,
              longitude: normalizedLongitude,
              latitude: normalizedLatitude,
              asl: normalizedAsl,
              agl: normalizedAgl,
              heading: Number.isFinite(normalizedHeading) ? normalizedHeading : 0,
              velocity: Number.isFinite(normalizedVelocity) ? normalizedVelocity : 60,
              startTime: Number.isFinite(normalizedStartTime) ? normalizedStartTime : 0,
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

export const updateDronesGroupWithDrones = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    drones?: Array<Partial<Drone> & {
      id?: number;
      drones_group_id?: number;
      longitude?: number;
      latitude?: number;
      asl?: number;
      agl?: number;
      heading?: number;
      velocity?: number;
      type?: number;
    }>;
  },
): Promise<{ group: DronesGroup; drones: Drone[] } | null> => {
  const repo = getDronesGroupRepository();

  const result = await AppDataSource.transaction(async (manager) => {
    const groupRepo = manager.getRepository(DronesGroup);
    const droneRepo = manager.getRepository(Drone);

    const existingGroup = await groupRepo.findOne({
      where: { id },
      relations: { drones: true },
    });

    if (!existingGroup) {
      return null;
    }

    if (data.name !== undefined || data.description !== undefined) {
      const nextName = data.name !== undefined ? String(data.name).trim() : existingGroup.name;
      const nextDescription =
        data.description !== undefined
          ? String(data.description).trim() || undefined
          : existingGroup.description;

      await groupRepo.update(id, {
        name: nextName || existingGroup.name,
        description: nextDescription,
      });
    }

    const incomingDrones = Array.isArray(data.drones) ? data.drones : [];
    const existingDrones = [...(existingGroup.drones ?? [])];
    const existingById = new Map(existingDrones.map((drone) => [drone.id, drone]));
    const incomingIds = new Set<number>();

    const upserts: Drone[] = [];
    const created: Drone[] = [];

    for (const droneData of incomingDrones) {
      const droneId = droneData.id !== undefined ? Number(droneData.id) : undefined;
      const normalizedType = Number(droneData.type ?? 1);
      const normalizedLongitude = Number(droneData.longitude ?? 0);
      const normalizedLatitude = Number(droneData.latitude ?? 0);
      const normalizedAsl = Number(droneData.asl ?? droneData.agl ?? 100);
      const normalizedAgl = Number(droneData.agl ?? droneData.asl ?? 100);
      const normalizedHeading = Number(droneData.heading ?? 0);
      const normalizedVelocity = Number(droneData.velocity ?? 60);
      // scenario.drone.start_time is NOT NULL with no default — default
      // to 0 when the client doesn't send one.
      const rawStartTime = (droneData as { startTime?: number; start_time?: number }).startTime
        ?? (droneData as { startTime?: number; start_time?: number }).start_time;
      const normalizedStartTime = Number(rawStartTime ?? 0);

      const droneEntity = {
        dronesGroupId: id,
        longitude: normalizedLongitude,
        latitude: normalizedLatitude,
        asl: normalizedAsl,
        agl: normalizedAgl,
        heading: Number.isFinite(normalizedHeading) ? normalizedHeading : 0,
        velocity: Number.isFinite(normalizedVelocity) ? normalizedVelocity : 60,
        startTime: Number.isFinite(normalizedStartTime) ? normalizedStartTime : 0,
        type: Number.isFinite(normalizedType) ? normalizedType : 1,
      };

      if (Number.isInteger(droneId) && droneId! > 0 && existingById.has(droneId!)) {
        incomingIds.add(droneId!);
        const existingDrone = existingById.get(droneId!);
        if (existingDrone) {
          upserts.push(
            droneRepo.create({
              ...existingDrone,
              ...droneEntity,
              id: existingDrone.id,
              dronesGroupId: id,
            }),
          );
        }
      } else {
        created.push(droneRepo.create(droneEntity));
      }
    }

    if (upserts.length) {
      await Promise.all(
        upserts.map(async (drone) => {
          await droneRepo.save(drone);
        }),
      );
    }

    if (created.length) {
      await droneRepo.save(created);
    }

    const deleteCandidates = existingDrones.filter((drone) => !incomingIds.has(drone.id) && !incomingDrones.some((item) => Number(item.id) === drone.id));
    if (deleteCandidates.length) {
      await droneRepo.remove(deleteCandidates);
    }

    const refreshedGroup = await groupRepo.findOne({
      where: { id },
      relations: { drones: true },
    });

    if (refreshedGroup) {
      logger.info(`Updated drones group with id: ${id} and reconciled ${refreshedGroup.drones.length} drone rows`);
    }

    return { group: refreshedGroup ?? existingGroup, drones: refreshedGroup?.drones ?? existingDrones };
  });

  return result;
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
