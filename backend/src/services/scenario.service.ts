import { AppDataSource } from "../config/db";
import { Scenario, Drone } from "../Entities";
import { logger } from "../middleware/logger";

export const getScenarioRepository = () =>
  AppDataSource.getRepository(Scenario);

export type ScenarioInput = Partial<Scenario> & {
  drones_group_id?: number;
  launchers_group_id?: number;
};

export const getAllScenarios = async (): Promise<Scenario[]> => {
  const repo = getScenarioRepository();
  const scenarios = await repo.find({
    relations: {
      dronesGroup: { drones: true },
      launchersGroup: { launchers: true },
    },
    order: { id: "ASC" },
  });

  for (const s of scenarios) {
    const drones = s.dronesGroup?.drones ?? [];
    s.locations = getLocations(drones);
  }

  return scenarios;
};

export const getScenarioById = async (id: string): Promise<Scenario | null> => {
  const repo = getScenarioRepository();
  const scenario = await repo.findOne({
    where: { id },
    relations: {
      dronesGroup: { drones: { droneType: true } },
      launchersGroup: { launchers: { launcherType: true } },
    },
  });

  if (scenario) {
    const drones = scenario.dronesGroup?.drones ?? [];
    scenario.locations = getLocations(drones);
  }

  return scenario;
};

// Compute unique cardinal directions of drones relative to the center of Israel.
// Returns an array with one or more of: "צפון" | "דרום" | "מזרח" | "מערב"
export const getLocations = (drones?: Drone[] | null): string[] => {
  if (!drones || drones.length === 0) return [];

  const CENTER_LAT = 31.5;
  const CENTER_LON = 34.75;

  const dirs = new Set<string>();

  for (const d of drones) {
    if (!d) continue;
    const lat = Number(d.latitude);
    const lon = Number(d.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    if (lat > CENTER_LAT) dirs.add("צפון");
    if (lat < CENTER_LAT) dirs.add("דרום");
    if (lon > CENTER_LON) dirs.add("מזרח");
    if (lon < CENTER_LON) dirs.add("מערב");

    // short-circuit if all four found
    if (dirs.size === 4) break;
  }

  return Array.from(dirs);
};

export const createScenario = async (
  data: ScenarioInput,
): Promise<Scenario> => {
  const repo = getScenarioRepository();
  const scenario = repo.create({
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
  data: Partial<ScenarioInput>,
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
  if (
    data.launchersGroupId !== undefined ||
    data.launchers_group_id !== undefined
  ) {
    updatePayload.launchersGroupId =
      data.launchersGroupId ?? data.launchers_group_id;
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
