import { AppDataSource } from '../config/db';
import { Drone } from '../Entities';
import { logger } from '../middleware/logger';

export const getDroneRepository = () => AppDataSource.getRepository(Drone);

export type DroneInput = Partial<Drone> & {
  drones_group_id?: number;
};

export const getAllDrones = async (
  dronesGroupId?: number,
  includeRelations = false
): Promise<Drone[]> => {
  const repo = getDroneRepository();
  return repo.find({
    where: dronesGroupId !== undefined ? { dronesGroupId } : undefined,
    relations: includeRelations ? { dronesGroup: true, droneType: true } : undefined,
    order: { id: 'ASC' },
  });
};

export const getDroneById = async (
  id: number,
  includeRelations = false
): Promise<Drone | null> => {
  const repo = getDroneRepository();
  return repo.findOne({
    where: { id },
    relations: includeRelations ? { dronesGroup: true, droneType: true } : undefined,
  });
};

export const createDrone = async (data: DroneInput): Promise<Drone> => {
  const repo = getDroneRepository();
  const drone = repo.create({
    id: data.id,
    dronesGroupId: data.dronesGroupId ?? data.drones_group_id,
    longitude: data.longitude,
    latitude: data.latitude,
    asl: data.asl,
    agl: data.agl,
    heading: data.heading,
    velocity: data.velocity,
    type: data.type,
  });
  const saved = await repo.save(drone);
  logger.info(`Created drone with id: ${saved.id}`);
  return saved;
};

export const updateDrone = async (
  id: number,
  data: Partial<DroneInput>
): Promise<Drone | null> => {
  const repo = getDroneRepository();
  const existing = await repo.findOneBy({ id });
  if (!existing) {
    return null;
  }

  const updatePayload: Partial<Drone> = {};
  if (data.dronesGroupId !== undefined || data.drones_group_id !== undefined) {
    updatePayload.dronesGroupId = data.dronesGroupId ?? data.drones_group_id;
  }
  if (data.longitude !== undefined) updatePayload.longitude = data.longitude;
  if (data.latitude !== undefined) updatePayload.latitude = data.latitude;
  if (data.asl !== undefined) updatePayload.asl = data.asl;
  if (data.agl !== undefined) updatePayload.agl = data.agl;
  if (data.heading !== undefined) updatePayload.heading = data.heading;
  if (data.velocity !== undefined) updatePayload.velocity = data.velocity;
  if (data.type !== undefined) updatePayload.type = data.type;

  await repo.update(id, updatePayload);
  const updated = await repo.findOneBy({ id });
  if (updated) {
    logger.info(`Updated drone with id: ${id}`);
  }
  return updated;
};

export const deleteDrone = async (id: number): Promise<boolean> => {
  const repo = getDroneRepository();
  const result = await repo.delete(id);
  const deleted = (result.affected ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted drone with id: ${id}`);
  }
  return deleted;
};
