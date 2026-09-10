import { useEffect, useState, type ReactNode } from 'react';
import {
  getState,
  loadScenario,
  onTick,
  pauseClock,
  resumeClock,
  seekToTime,
  setSpeed,
  setState,
  startClock,
  stopClock,
  subscribe,
  type SimulationState,
} from './SimulationContext';
import { SimulationReactContext } from './SimulationReactContext';
import type { SimulationContextValue } from './SimulationReactContext';

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, setSimState] = useState<SimulationState>(getState);

  useEffect(() => {
    return subscribe(() => {
      setSimState(getState());
    });
  }, []);

  const value: SimulationContextValue = {
    state,
    getState,
    setState,
    loadScenario,
    startClock,
    pauseClock,
    resumeClock,
    stopClock,
    setSpeed,
    seekToTime,
    onTick,
    subscribe,
  };

  return (
    <SimulationReactContext.Provider value={value}>
      {children}
    </SimulationReactContext.Provider>
  );
}
