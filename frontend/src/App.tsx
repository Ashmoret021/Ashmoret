import { useEffect, useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSimulation } from './simulation/useSimulation';
import { loadScenario } from './simulation/SimulationContext';
import { LeafletRenderer } from './map/LeafletRenderer';
import { DroneType, InterceptorType, LauncherType } from '../../types/types';

// ---------------------------------------------------------------------------
// Test scenario — visible immediately without backend
// Two drones fly across Israel; one launcher sits in the centre.
// Remove / replace once Dev 1 provides real scenario loading.
// ---------------------------------------------------------------------------
const TEST_SCENARIO = {
  id: 'dev3-test',
  name: 'Developer 3 Renderer Test',
  startTime: 0,
  drones: [
    {
      id: 1,
      type: DroneType.SkyMiteC7,
      heading: 180,
      velocity: 80,       // 80 m/s
      location: { latitude: 33.2, longitude: 35.5, asl: 1000, agl: 800 },
      startTime: 0,
      route: [
        { latitude: 33.2,  longitude: 35.5,  asl: 1000, agl: 800 },
        { latitude: 32.8,  longitude: 35.2,  asl: 900,  agl: 700 },
        { latitude: 32.1,  longitude: 34.9,  asl: 800,  agl: 600 },
        { latitude: 31.7,  longitude: 34.7,  asl: 700,  agl: 500 },
      ],
    },
    {
      id: 2,
      type: DroneType.LoadBeeM2,
      heading: 225,
      velocity: 60,
      location: { latitude: 32.9, longitude: 36.1, asl: 1200, agl: 1000 },
      startTime: 5,        // launches 5 sim-seconds after start
      route: [
        { latitude: 32.9, longitude: 36.1, asl: 1200, agl: 1000 },
        { latitude: 32.4, longitude: 35.6, asl: 1100, agl: 900  },
        { latitude: 31.8, longitude: 35.0, asl: 1000, agl: 800  },
      ],
    },
  ],
  launchers: [
    {
      id: 1,
      type: LauncherType.ShieldNestLite,
      location: { latitude: 31.8, longitude: 34.9, asl: 50, agl: 0 },
      amount: 10,
      active: true,
      ammunition: [
        [InterceptorType.DartFoxS, 8] as [InterceptorType, number],
        [InterceptorType.NetWing30, 4] as [InterceptorType, number],
      ],
    },
  ],
};

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<LeafletRenderer | null>(null);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const { state, pauseClock, resumeClock, setSpeed, startClock } = useSimulation();

  useEffect(() => {
    if (!mapRef.current) return;

    // ── Create Leaflet map with Canvas renderer for performance (spec §36) ──
    const map = L.map(mapRef.current, { preferCanvas: true }).setView([32.0, 35.1], 8);

    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; OpenStreetMap contributors' },
    );

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri' },
    );

    streetLayer.addTo(map);
    L.control.layers({ '🗺️ מפה רגילה': streetLayer, '🛰️ צילום לווייני': satelliteLayer }).addTo(map);

    fetch('/CITIES.geojson')
      .then((r) => r.json())
      .then((data) => L.geoJSON(data).addTo(map))
      .catch(() => { /* geojson optional */ });

    // ── Create renderer and attach to map ───────────────────────────────────
    const renderer = new LeafletRenderer(map);
    rendererRef.current = renderer;

    // ── Load test scenario so markers appear immediately ────────────────────
    loadScenario(TEST_SCENARIO);
    renderer.initDefenseSystems();

    // ── Start renderer render loop (60 FPS, decoupled from sim logic) ───────
    renderer.start();

    return () => {
      renderer.stop();
      rendererRef.current = null;
      map.remove();
    };
  }, []);

  const stateJson = JSON.stringify(state, null, 2);
  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';

  const toggleClock = () => {
    if (isRunning) {
      pauseClock();
    } else if (isPaused) {
      resumeClock();
    } else {
      startClock();
    }
  };

  return (
    <div style={{ height: '100vh', position: 'relative', width: '100vw' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      <Button
        onClick={() => setIsStateDialogOpen(true)}
        style={{ left: 16, position: 'absolute', top: 16, zIndex: 1000 }}
        variant="contained"
      >
        View simulation state
      </Button>
      <Dialog
        fullWidth
        maxWidth="md"
        onClose={() => setIsStateDialogOpen(false)}
        open={isStateDialogOpen}
      >
        <DialogTitle>Simulation state</DialogTitle>
        <DialogContent>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 13,
              margin: 0,
              maxHeight: '60vh',
              overflow: 'auto',
              padding: 16,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {stateJson}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleClock}>
            {isRunning ? 'Pause clock' : 'Run clock'}
          </Button>
          <select
            aria-label="Simulation speed"
            value={state.speedMultiplier}
            onChange={(event) => setSpeed(Number(event.target.value) as 1 | 2 | 5 | 10)}
          >
            {[1, 2, 5, 10].map((speed) => (
              <option key={speed} value={speed}>
                x{speed}
              </option>
            ))}
          </select>
          <Button onClick={() => setIsStateDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

