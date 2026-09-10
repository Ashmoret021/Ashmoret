import type { SimulationState, DroneSimState, LauncherSimState, InterceptorSimState } from '../simulation/SimulationContext';
import type { Location } from '../../../types/types';
import type {
  WorldSnapshot,
  ThreatSnapshot,
  DefenseSystemSnapshot,
  ActiveInterceptorSnapshot,
  ActiveEngagementInfo,
  LatLng,
} from './types';

export class WorldSnapshotBuilder {
  /**
   * Builds a WorldSnapshot payload from current logical SimulationState and tickId.
   */
  public static buildSnapshot(state: SimulationState, tickId: number): WorldSnapshot {
    const activeEngagements: ActiveEngagementInfo[] = [];

    // 1. Extract active threats
    const activeThreats: ThreatSnapshot[] = Object.values(state.threats || {})
      .filter((threat: DroneSimState) => threat.logicalStatus === 'active' || threat.logicalStatus === 'interceptPending')
      .map((threat: DroneSimState) => {
        const isEngaged = threat.logicalStatus === 'interceptPending';
        if (isEngaged) {
          activeEngagements.push({
            threatId: String(threat.id),
          });
        }

        const position: LatLng = {
          lat: threat.location?.latitude ?? 0,
          lng: threat.location?.longitude ?? 0,
        };

        const route: LatLng[] = (threat.route || []).map((pt: Location) => ({
          lat: pt.latitude ?? 0,
          lng: pt.longitude ?? 0,
        }));

        return {
          id: String(threat.id),
          type: String(threat.type ?? 'unknown'),
          position,
          route,
          progress: threat.progress || 0,
          engagementStatus: isEngaged ? 'engaged' : 'none',
        };
      });

    // 2. Extract defense systems (launchers) and inventory
    const defenseSystems: DefenseSystemSnapshot[] = Object.values(state.launchers || {}).map(
      (launcher: LauncherSimState) => {
        const position: LatLng = {
          lat: launcher.location?.latitude ?? 0,
          lng: launcher.location?.longitude ?? 0,
        };

        // launcher.ammunition (when present) is an array of LauncherAmmunition
        // rows: { launcherId, interceptorTypeId, amount } — matching the DB shape.
        const interceptorInventory = (launcher.ammunition || []).map((row) => ({
          type: String(row.interceptorTypeId),
          quantity: Number(row.amount),
        }));

        return {
          id: String(launcher.id),
          type: String(launcher.type ?? 'Launcher'),
          position,
          interceptorInventory,
        };
      }
    );

    // 3. Extract active interceptors
    const activeInterceptors: ActiveInterceptorSnapshot[] = Object.values(state.interceptors || {})
      .filter((interceptor: InterceptorSimState) => interceptor.status === 'flying')
      .map((interceptor: InterceptorSimState) => {
        const position: LatLng = {
          lat: interceptor.location?.latitude ?? 0,
          lng: interceptor.location?.longitude ?? 0,
        };

        return {
          id: String(interceptor.id),
          type: String(interceptor.type),
          targetId: String(interceptor.targetDroneId),
          position,
        };
      });

    return {
      tickId,
      simulationTime: state.simulationTime,
      activeThreats,
      defenseSystems,
      activeInterceptors,
      activeEngagements,
    };
  }
}
