import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapView } from './ui/MapView';
import { SimulationControls } from './ui/SimulationControls';
import { SimulationStats } from './ui/SimulationStats';
import { EventLog } from './ui/EventLog';
import { MapLegend } from './ui/MapLegend';
import { useSimulation } from './simulation/useSimulation';
import { sampleScenario } from './simulation/sampleScenario';
import { LeafletRenderer } from './map/LeafletRenderer';

export default function App() {
  const { loadScenario } = useSimulation();
  const rendererRef = useRef<LeafletRenderer | null>(null);

  useEffect(() => {
    // Load default realistic scenario
    loadScenario(sampleScenario);
  }, [loadScenario]);

  const handleMapReady = useCallback((map: L.Map) => {
    // Create LeafletRenderer for 60 FPS visual rendering decoupled from sim logic
    const renderer = new LeafletRenderer(map);
    rendererRef.current = renderer;

    renderer.initDefenseSystems();
    renderer.start();
  }, []);

  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.stop();
        rendererRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ height: '100vh', position: 'relative', width: '100vw', overflow: 'hidden' }}>
      {/* Central Map View with LeafletRenderer callback */}
      <MapView onMapReady={handleMapReady} />

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
