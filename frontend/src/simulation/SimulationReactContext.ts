import { createContext } from 'react';
import {
  getState,
  loadScenario,
  onTick,
  pauseClock,
  resumeClock,
  setSpeed,
  setState,
  startClock,
  stopClock,
  subscribe,
  type SimulationState,
} from './SimulationContext';

export interface SimulationContextValue {
  state: SimulationState;
  getState: typeof getState;
  setState: typeof setState;
  loadScenario: typeof loadScenario;
  startClock: typeof startClock;
  pauseClock: typeof pauseClock;
  resumeClock: typeof resumeClock;
  stopClock: typeof stopClock;
  setSpeed: typeof setSpeed;
  onTick: typeof onTick;
  subscribe: typeof subscribe;
}

export const SimulationReactContext = createContext<SimulationContextValue | null>(null);