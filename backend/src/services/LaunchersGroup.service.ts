import { AppDataSource } from '../config/db';
import { LaunchersGroup, Launcher, LauncherAmmunition, InterceptorType } from '../Entities';
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

/**
 * Per-interceptor-type ammunition load. Each interceptor type gets a fixed
 * stockpile in the 8-16 range, so the amount an operator gets to shoot
 * depends only on which interceptor they chose — not on caller-supplied
 * input. Keyed by `interceptor_type.id` (see the seed rows in
 * `backend/SQL/init.sql`). Any type id not listed falls back to
 * `DEFAULT_AMMO_AMOUNT`.
 */
const INTERCEPTOR_AMMO_AMOUNT_BY_TYPE_ID: Record<number, number> = {
  1: 16, // BuzzStop15
  2: 14, // NetWing30
  3: 12, // DartFoxS
  4: 10, // SpearMini70
  5: 8,  // SkyLanceM
  6: 15, // FalconClipH
  7: 11, // SwarmMist5
  8: 9,  // MicroNetR
};
const DEFAULT_AMMO_AMOUNT = 10;
const ammoAmountFor = (interceptorTypeId: number): number =>
  INTERCEPTOR_AMMO_AMOUNT_BY_TYPE_ID[interceptorTypeId] ?? DEFAULT_AMMO_AMOUNT;

/**
 * Create a launchers group AND its launchers in one transaction. Mirrors
 * `createDronesGroupWithDrones` so the frontend can POST an entire defense
 * side in one round trip.
 */
export const createLaunchersGroupWithLaunchers = async (data: {
  name?: string;
  description?: string;
  launchers?: Array<{
    longitude?: number;
    latitude?: number;
    asl?: number;
    agl?: number;
    type?: number;
    amount?: number;
    active?: boolean;
    ammunition?: Array<{ interceptorTypeId?: number; amount?: number }>;
  }>;
}): Promise<{ group: LaunchersGroup; launchers: Launcher[] }> => {
  return AppDataSource.transaction(async (manager) => {
    const groupRepo = manager.getRepository(LaunchersGroup);
    const launcherRepo = manager.getRepository(Launcher);
    const ammoRepo = manager.getRepository(LauncherAmmunition);
    const interceptorTypeRepo = manager.getRepository(InterceptorType);

    const name = String(data.name ?? 'Unnamed defense').trim();
    const description = data.description ?? null;

    const groupEntity = groupRepo.create({
      name: name || 'Unnamed defense',
      description: description?.trim() ? description.trim() : undefined,
    });

    const group = await groupRepo.save(groupEntity);

    const incoming = Array.isArray(data.launchers) ? data.launchers : [];

    // Resolve a fallback interceptor type once so we can guarantee each
    // launcher gets at least one ammunition row — otherwise the algorithm
    // sees an empty inventory and no interceptor is ever dispatched. See
    // `WorldSnapshotBuilder.interceptorInventory` on the frontend.
    const fallbackType = await interceptorTypeRepo.findOne({
      where: {},
      order: { id: 'ASC' },
    });
    const fallbackInterceptorTypeId = fallbackType?.id;

    const savedLaunchers = incoming.length
      ? await launcherRepo.save(
          incoming.map((row) => {
            const normalizedType = Number(row.type ?? 1);
            const normalizedLongitude = Number(row.longitude ?? 0);
            const normalizedLatitude = Number(row.latitude ?? 0);
            const normalizedAsl = Number(row.asl ?? row.agl ?? 0);
            const normalizedAgl = Number(row.agl ?? row.asl ?? 0);
            const normalizedAmount = Number(row.amount ?? 1);

            return launcherRepo.create({
              launchersGroupId: group.id,
              longitude: normalizedLongitude,
              latitude: normalizedLatitude,
              asl: normalizedAsl,
              agl: normalizedAgl,
              type: Number.isFinite(normalizedType) ? normalizedType : 1,
              amount: Number.isFinite(normalizedAmount) ? normalizedAmount : 1,
              active: row.active ?? true,
            });
          }),
        )
      : [];

    // Insert ammunition rows for each saved launcher, in the same order as
    // `incoming` (TypeORM preserves order on multi-row save). Ammunition
    // amount per row is derived from the interceptor type via
    // `ammoAmountFor` — any client-supplied `amount` is ignored so every
    // interceptor of a given type has the same fixed stockpile.
    const ammoRows: LauncherAmmunition[] = [];
    for (let i = 0; i < savedLaunchers.length; i++) {
      const launcher = savedLaunchers[i];
      const input = incoming[i];
      const providedAmmo = Array.isArray(input?.ammunition)
        ? input!.ammunition!
        : [];

      const normalizedAmmo = providedAmmo
        .map((a) => Number(a?.interceptorTypeId ?? 0))
        .filter((id) => Number.isFinite(id) && id > 0)
        .map((interceptorTypeId) => ({
          interceptorTypeId,
          amount: ammoAmountFor(interceptorTypeId),
        }));

      const finalAmmo = normalizedAmmo.length
        ? normalizedAmmo
        : fallbackInterceptorTypeId
          ? [
              {
                interceptorTypeId: fallbackInterceptorTypeId,
                amount: ammoAmountFor(fallbackInterceptorTypeId),
              },
            ]
          : [];

      for (const a of finalAmmo) {
        ammoRows.push(
          ammoRepo.create({
            launcherId: launcher.id,
            interceptorTypeId: a.interceptorTypeId,
            amount: a.amount,
          }),
        );
      }
    }

    if (ammoRows.length) {
      await ammoRepo.save(ammoRows);
    }

    logger.info(
      `Created launchers group with id: ${group.id} and ${savedLaunchers.length} launcher rows, ${ammoRows.length} ammunition rows`,
    );

    return { group, launchers: savedLaunchers };
  });
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
    await repo.update(id, updatePayload as any);
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
