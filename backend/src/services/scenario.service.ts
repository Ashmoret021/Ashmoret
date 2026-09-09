import { AppDataSource } from '../config/db';
import { Scenario } from '../Entities';
import { logger } from '../utils/logger';

export const getScenarioRepository = () => AppDataSource.getRepository(Scenario);

export type ScenarioInput = Partial<Scenario> & {
  drones_group_id?: number;
  launchers_group_id?: number;
};

export const getAllScenarios = async (): Promise<Scenario[]> => {
  const repo = getScenarioRepository();
  return repo.find({
    relations: { dronesGroup: true, launchersGroup: true },
    order: { id: 'ASC' },
  });
};

export const getScenarioById = async (id: string): Promise<Scenario | null> => {
  const repo = getScenarioRepository();
  return repo.findOne({
    where: { id },
    relations: { dronesGroup: true, launchersGroup: true },
  });
};

export const createScenario = async (data: ScenarioInput): Promise<Scenario> => {
  const repo = getScenarioRepository();
  const scenario = repo.create({
    id: data.id,
    name: data.name,
    dronesGroupId: data.dronesGroupId ?? data.drones_group_id,
    launchersGroupId: data.launchersGroupId ?? data.launchers_group_id,
    type: data.type,
  });
  const saved = await repo.save(scenario);
  logger.info(`Created scenario with id: ${saved.id}`);
  return saved;
};

export const updateScenario = async (
  id: string,
  data: Partial<ScenarioInput>
): Promise<Scenario | null> => {
  const repo = getScenarioRepository();
  const existing = await repo.findOneBy({ id });
  if (!existing) {
    return null;
  }

  const updatePayload: Partial<Scenario> = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.type !== undefined) updatePayload.type = data.type;
  if (data.dronesGroupId !== undefined || data.drones_group_id !== undefined) {
    updatePayload.dronesGroupId = data.dronesGroupId ?? data.drones_group_id;
  }
  if (data.launchersGroupId !== undefined || data.launchers_group_id !== undefined) {
    updatePayload.launchersGroupId = data.launchersGroupId ?? data.launchers_group_id;
  }

  await repo.update(id, updatePayload);
  const updated = await repo.findOneBy({ id });
  if (updated) {
    logger.info(`Updated scenario with id: ${id}`);
  }
  return updated;
};

export const deleteScenario = async (id: string): Promise<boolean> => {
  const repo = getScenarioRepository();
  const result = await repo.delete(id);
  const deleted = (result.affected ?? 0) > 0;
  if (deleted) {
    logger.info(`Deleted scenario with id: ${id}`);
  }
  return deleted;
};
