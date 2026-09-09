import { useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSimulation } from './simulation/useSimulation';
import { SimulationControls } from './ui/SimulationControls';
import { SimulationStats } from './ui/SimulationStats';

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerControlSlotRef = useRef<HTMLDivElement | null>(null);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const { state, pauseClock, resumeClock, setSpeed, startClock } = useSimulation();
  const [layers, setLayers] = useState<string[]>(["🗺️ מפה רגילה"]);
  const [rulerActive, setRulerActive] = useState(false);
  const rulerStateRef = useRef<{
    points: L.LatLng[];
    markers: L.Marker[];
    line: L.Polyline | null;
  }>({ points: [], markers: [], line: null });

  useEffect(() => {
    console.log("Active layers:", layers);
  }, [layers]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = L.map(mapRef.current).setView([31.0461, 34.8516], 6);
    mapInstanceRef.current = map;

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

    // Dark blue command center map matching reference design
    const darkBlueLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
        className: "dark-blue-tile-layer",
      },
    );

    streetLayer.addTo(map);

    const baseMaps = {
      "🗺️ מפה רגילה": streetLayer,
      "🛰️ צילום לווייני": satelliteLayer,
      "🔵 מפה כחולה כהה": darkBlueLayer,
    };

    L.control.layers(baseMaps).addTo(map);

    const layerControl = L.control
      .layers(baseMaps)
      .addTo(map);


    const controlContainer = layerControl.getContainer();
    if (controlContainer && layerControlSlotRef.current) {
      layerControlSlotRef.current.appendChild(controlContainer);
    }

    fetch("/CITIES.geojson")
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data).addTo(map);
      });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // --- Ruler helpers ---
  const clearRuler = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const rs = rulerStateRef.current;
    rs.markers.forEach((m) => map.removeLayer(m));
    if (rs.line) map.removeLayer(rs.line); // also removes its bound tooltip
    rulerStateRef.current = { points: [], markers: [], line: null };
  };

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleRulerClick = (e: L.LeafletMouseEvent) => {
      const rs = rulerStateRef.current;

      if (rs.points.length >= 2) {
        clearRuler();
      }

      const dotIcon = L.divIcon({
        className: "",
        html: `<div style="width:10px;height:10px;border-radius:50%;background:#e53935;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.5);"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const marker = L.marker(e.latlng, { icon: dotIcon }).addTo(map);
      rulerStateRef.current.points.push(e.latlng);
      rulerStateRef.current.markers.push(marker);

      if (rulerStateRef.current.points.length === 2) {
        const [p1, p2] = rulerStateRef.current.points;
        const distKm = (p1.distanceTo(p2) / 1000).toFixed(2);

        const line = L.polyline([p1, p2], {
          color: "#e53935",
          weight: 2,
          dashArray: "6 4",
        }).addTo(map);

        const mid = L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);

        line
          .bindTooltip(`${distKm} ק"מ`, {
            permanent: true,
            direction: "center",
          })
          .openTooltip(mid);

        rulerStateRef.current.line = line;
      }
    };

    if (rulerActive) {
      map.getContainer().style.cursor = "crosshair";
      map.on("click", handleRulerClick);
    } else {
      map.getContainer().style.cursor = "";
      map.off("click", handleRulerClick);
      clearRuler();
    }

    return () => {
      map.off("click", handleRulerClick);
    };
  }, [rulerActive]);

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
    <>
      <style>
        {`
          .dark-blue-tile-layer {
            filter: sepia(100%) hue-rotate(185deg) saturate(340%) brightness(120%) contrast(120%);
          }
        `}
      </style>
      <div style={{ height: '100vh', position: 'relative', width: '100vw', overflow: 'hidden' }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        <Box
          sx={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Box ref={layerControlSlotRef} />
          <Button
            title={rulerActive ? "בטל מדידה (ESC)" : "מדוד מרחק"}
            onClick={() => setRulerActive((a) => !a)}
            sx={{
              minWidth: '38px',
              width: '34px',
              height: '38px',
              border: '2px solid',
              borderColor: rulerActive ? '#388e3c' : 'rgba(0,0,0,.2)',
              backgroundColor: 'white',
              fontSize: '22px',
              transition: 'background 0.15s',
              '&:hover': {
                backgroundColor: rulerActive ? '#e8f5e9' : '#f4f4f4'
              },
            }}
          >
            📏
          </Button>
        </Box>
        <Button
          onClick={() => setIsStateDialogOpen(true)}
          style={{ left: 16, position: 'absolute', top: 16, zIndex: 1000 }}
          variant="contained"
        >
          View simulation state
        </Button>

        {/* Mission 4.2: Simulation Stats HUD */}
        <SimulationStats />

        {/* Mission 4.1: Simulation Control Bar */}
        <SimulationControls />

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
    </>
  );
}