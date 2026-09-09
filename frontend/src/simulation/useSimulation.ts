import { useContext } from 'react';
import {
  SimulationReactContext,
  type SimulationContextValue,
} from './SimulationReactContext';

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationReactContext);
  if (context === null) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }

  return context;
}