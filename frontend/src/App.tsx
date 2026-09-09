import { useEffect } from 'react';
import { MapView } from './ui/MapView';
import { SimulationControls } from './ui/SimulationControls';
import { SimulationStats } from './ui/SimulationStats';
import { EventLog } from './ui/EventLog';
import { MapLegend } from './ui/MapLegend';
import { useSimulation } from './simulation/useSimulation';
import { sampleScenario } from './simulation/sampleScenario';

export default function App() {
  const { loadScenario } = useSimulation();

  useEffect(() => {
    loadScenario(sampleScenario);
  }, [loadScenario]);

  return (
    <div style={{ height: '100vh', position: 'relative', width: '100vw', overflow: 'hidden' }}>
      {/* Central Map View */}
      <MapView />

      {/* Mission 4.4: Map Legend and Settings */}
      <MapLegend />

      {/* Mission 4.3: Chronological Event Log */}
      <EventLog />

      {/* Mission 4.2: Simulation Stats HUD */}
      <SimulationStats />

      {/* Mission 4.1: Simulation Control Bar */}
      <SimulationControls />
    </div>
  );
}



