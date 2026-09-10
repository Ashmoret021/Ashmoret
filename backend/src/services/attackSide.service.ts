import { AppDataSource } from '../config/db';
import { AttackSide, Scenario } from '../Entities';
import { logger } from '../middleware/logger';

export const getAttackSideRepository = () =>
  AppDataSource.getRepository(AttackSide);

export type AttackSideInput = Partial<AttackSide> & {
  scenario_id?: string;
  drones_group_id?: number;
  drone_id?: number;
  launcher_id?: number;
  config?: Record<string, unknown>;
};

export const getAllAttackSides = async (
  scenarioId?: string,
): Promise<AttackSide[]> => {
  const repo = getAttackSideRepository();

  return repo.find({
    where: scenarioId ? { scenarioId } : undefined,
    relations: { scenario: true, drone: true, dronesGroup: true, launcher: true },
    order: { id: 'ASC' },
  });
};

export const getAttackSideById = async (id: number): Promise<AttackSide | null> => {
  const repo = getAttackSideRepository();

  return repo.findOne({
    where: { id },
    relations: { scenario: true, drone: true, dronesGroup: true, launcher: true },
  });
};

export const createAttackSide = async (data: AttackSideInput): Promise<AttackSide> => {
  const repo = getAttackSideRepository();
  const scenarioRepo = AppDataSource.getRepository(Scenario);

  const rawScenarioId = data.scenarioId ?? data.scenario_id ?? null;
  const resolvedScenarioId = rawScenarioId
    ? (await scenarioRepo.exists({ where: { id: rawScenarioId } }) ? rawScenarioId : null)
    : null;

  const payload = repo.create({
    name: data.name,
    description: data.description,
    scenarioId: resolvedScenarioId,
    dronesGroupId: data.dronesGroupId ?? data.drones_group_id,
    droneId: data.droneId ?? data.drone_id,
    launcherId: data.launcherId ?? data.launcher_id,
    active: data.active ?? true,
    config: data.config ?? {},
  });

  const saved = await repo.save(payload);
  logger.info(`Created attack side with id: ${saved.id}`);
  return saved;
};

export const updateAttackSide = async (
  id: number,
  data: Partial<AttackSideInput>,
): Promise<AttackSide | null> => {
  const repo = getAttackSideRepository();
  const scenarioRepo = AppDataSource.getRepository(Scenario);
  const existing = await repo.findOneBy({ id });

  if (!existing) {
    return null;
  }

  const updatePayload: Partial<AttackSide> = {};

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.scenarioId !== undefined || data.scenario_id !== undefined) {
    const requestedScenarioId = data.scenarioId ?? data.scenario_id ?? null;
    const resolvedScenarioId = requestedScenarioId
      ? (await scenarioRepo.exists({ where: { id: requestedScenarioId } }) ? requestedScenarioId : null)
      : null;
    updatePayload.scenarioId = resolvedScenarioId;
  }
  if (data.dronesGroupId !== undefined || data.drones_group_id !== undefined) {
    updatePayload.dronesGroupId = data.dronesGroupId ?? data.drones_group_id;
  }
  if (data.droneId !== undefined || data.drone_id !== undefined) {
    updatePayload.droneId = data.droneId ?? data.drone_id;
  }
  if (data.launcherId !== undefined || data.launcher_id !== undefined) {
    updatePayload.launcherId = data.launcherId ?? data.launcher_id;
  }
  if (data.active !== undefined) updatePayload.active = data.active;
  if (data.config !== undefined) updatePayload.config = data.config;

  await repo.update(id, updatePayload as any);
  const updated = await repo.findOne({
    where: { id },
    relations: { scenario: true, drone: true, dronesGroup: true, launcher: true },
  });

  if (updated) {
    logger.info(`Updated attack side with id: ${id}`);
  }

  return updated;
};

export const deleteAttackSide = async (id: number): Promise<boolean> => {
  const repo = getAttackSideRepository();
  const result = await repo.delete(id);
  const deleted = (result.affected ?? 0) > 0;

  if (deleted) {
    logger.info(`Deleted attack side with id: ${id}`);
  }

  return deleted;
};
