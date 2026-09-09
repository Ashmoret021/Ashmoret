import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SimulationControls } from './ui/SimulationControls';
import { SimulationStats } from './ui/SimulationStats';
import { EventLog } from './ui/EventLog';

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = L.map(mapRef.current).setView([31.0461, 34.8516], 6);

    const streetLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      },
    );

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
      },
    );

    streetLayer.addTo(map);

    const baseMaps = {
      "🗺️ מפה רגילה": streetLayer,
      "🛰️ צילום לווייני": satelliteLayer,
    };

    L.control.layers(baseMaps).addTo(map);

    fetch("/CITIES.geojson")
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data).addTo(map);
      });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div style={{ height: '100vh', position: 'relative', width: '100vw', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

      {/* Mission 4.3: Chronological Event Log */}
      <EventLog />

      {/* Mission 4.2: Simulation Stats HUD */}
      <SimulationStats />

      {/* Mission 4.1: Simulation Control Bar */}
      <SimulationControls />
    </div>
  );
}


