import type { WorldSnapshot, AlgorithmResponse } from './types';
import { MockAlgorithmServer } from './mockServer';

export interface AlgorithmClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export class AlgorithmClient {
  private baseUrl: string;
  private timeoutMs: number;
  private latestProcessedTick: number = -1;
  private isAvailable: boolean = true;
  private mockServer = new MockAlgorithmServer({ successRate: 0.85 });

  constructor(options?: AlgorithmClientOptions) {
    this.baseUrl = options?.baseUrl || '';
    this.timeoutMs = options?.timeoutMs || 3000;
  }

  /**
   * Resets internal state (e.g. on scenario restart).
   */
  public reset(): void {
    this.latestProcessedTick = -1;
    this.isAvailable = true;
  }

  /**
   * Returns current availability status of the algorithm server.
   */
  public getIsAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Sends WorldSnapshot to the algorithm service asynchronously via POST /simulation/step.
   * Filters out stale/out-of-order responses using tickId.
   */
  public async step(snapshot: WorldSnapshot): Promise<AlgorithmResponse | null> {
    const useMock =
      !this.baseUrl ||
      import.meta.env.VITE_USE_MOCK_ALGORITHM === 'true';

    if (useMock) {
      return this.mockServer.handleStep(snapshot);
    }

    const endpoint = `${this.baseUrl}/simulation/step`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ snapshot }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.isAvailable = false;
        console.warn(`Algorithm API returned status ${response.status}, falling back to mock`);
        return this.mockServer.handleStep(snapshot);
      }

      const data: AlgorithmResponse = await response.json();
      this.isAvailable = true;

      // Filter out stale or out-of-order responses
      if (data.tickId !== undefined && data.tickId <= this.latestProcessedTick) {
        console.info(`Ignoring out-of-order algorithm response for tickId ${data.tickId} (latest is ${this.latestProcessedTick})`);
        return null;
      }

      if (data.tickId !== undefined) {
        this.latestProcessedTick = data.tickId;
      }

      return data;
    } catch (error) {
      this.isAvailable = false;
      console.warn('Algorithm API call failed, operating in mock fallback mode:', error);
      return this.mockServer.handleStep(snapshot);
    }
  }
}

export const algorithmClient = new AlgorithmClient({
  baseUrl: import.meta.env.VITE_ALGORITHM_URL ?? '',
});
