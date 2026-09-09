import type { WorldSnapshot, AlgorithmResponse } from './types';

export interface AlgorithmClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export class AlgorithmClient {
  private baseUrl: string;
  private timeoutMs: number;
  private latestProcessedTick: number = -1;
  private isAvailable: boolean = true;

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
        console.warn(`Algorithm API returned status ${response.status}`);
        return null;
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
      console.warn('Algorithm API call failed, operating in fallback mode:', error);
      return null;
    }
  }
}
