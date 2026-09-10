import type {
  WorldSnapshot,
  AlgorithmResponse,
  EngagementDecision,
  DefenseSystemSnapshot,
} from './types';

export interface MockServerOptions {
  successRate?: number; // e.g. 0.85 for 85% success probability
  simulatedDelayMs?: number;
}

export class MockAlgorithmServer {
  private successRate: number;
  private simulatedDelayMs: number;

  constructor(options?: MockServerOptions) {
    this.successRate = options?.successRate ?? 0.85;
    this.simulatedDelayMs = options?.simulatedDelayMs ?? 0;
  }

  /**
   * Processes a WorldSnapshot and returns simulated engagement decisions.
   */
  public async handleStep(snapshot: WorldSnapshot): Promise<AlgorithmResponse> {
    if (this.simulatedDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.simulatedDelayMs));
    }

    const engagements: EngagementDecision[] = [];

    // Filter threats that are not already engaged or pending engagement
    const unengagedThreats = snapshot.activeThreats.filter(
      (threat) => threat.engagementStatus !== 'engaged'
    );

    // Deep copy defense systems to keep track of remaining ammo in this tick decision
    const availableLaunchers: DefenseSystemSnapshot[] = JSON.parse(
      JSON.stringify(snapshot.defenseSystems || [])
    );

    for (const threat of unengagedThreats) {
      // Find a launcher with available interceptors
      const matchingLauncher = availableLaunchers.find((launcher) =>
        launcher.interceptorInventory.some((item) => item.quantity > 0)
      );

      if (!matchingLauncher) {
        // No available ammo left across systems
        break;
      }

      // Pick the first available interceptor type with quantity > 0
      const ammoItem = matchingLauncher.interceptorInventory.find(
        (item) => item.quantity > 0
      );

      if (!ammoItem) continue;

      // Decrement simulated ammo quantity
      ammoItem.quantity -= 1;

      // Determine success vs failure based on successRate
      const isSuccess = Math.random() <= this.successRate;

      engagements.push({
        defenseSystemId: matchingLauncher.id,
        interceptorType: ammoItem.type,
        targetId: threat.id,
        result: isSuccess ? 'success' : 'failure',
      });
    }

    return {
      tickId: snapshot.tickId,
      engagements,
      status: 'ok',
    };
  }
}

/**
 * Helper function for quick standalone mock invocation
 */
export async function handleMockStep(
  snapshot: WorldSnapshot,
  successRate: number = 0.85
): Promise<AlgorithmResponse> {
  const server = new MockAlgorithmServer({ successRate });
  return server.handleStep(snapshot);
}
