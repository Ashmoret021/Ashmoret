import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LeafletRenderer } from './map/LeafletRenderer';
import { loadScenario } from './simulation/SimulationContext';
import { DroneType, InterceptorType, LauncherType } from '../../types/types';
import { SimulationControls } from './ui/SimulationControls';
import { SimulationStats } from './ui/SimulationStats';
import { EventLog } from './ui/EventLog';
import { MapLegend } from './ui/MapLegend';

// ---------------------------------------------------------------------------
// Test scenario — visible immediately until Dev 1 scenario loading is hooked
// Two drones fly across Israel; one launcher sits in the centre.
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

  return (
    <div style={{ height: '100vh', position: 'relative', width: '100vw', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

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
