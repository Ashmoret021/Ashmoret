import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSimulation } from "./simulation/useSimulation";
import { SimulationControls } from "./ui/SimulationControls";
import { SimulationStats } from "./ui/SimulationStats";
import { Drone, DroneType } from "./types/types";
import DroneModal from "./components/DroneModal/DroneModal";
import { AddScenerioModal } from "./components";

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const { state, pauseClock, resumeClock, setSpeed, startClock } =
    useSimulation();

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
        L.geoJSON(data, {
          style: {
            color: "#d32f2f",
            fillColor: "#d32f2f",
            fillOpacity: 0.35,
          },
        }).addTo(map);
      });

    return () => {
      map.remove();
    };
  }, []);

  const stateJson = JSON.stringify(state, null, 2);
  const isRunning = state.status === "running";
  const isPaused = state.status === "paused";

  const toggleClock = () => {
    if (isRunning) {
      pauseClock();
    } else if (isPaused) {
      resumeClock();
    } else {
      startClock();
    }
  };

  const drone: Drone = {
    id: 1,
    location: { agl: 1, asl: 1, latitude: 31, longitude: 34 },
    type: DroneType.FalconLongX4,
    velocity: 67,
    heading: 3,
  };

  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(drone);

  return (
    <div
      style={{
        height: "100vh",
        position: "relative",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {selectedDrone && (
        <DroneModal
          drone={selectedDrone}
          estimatedDamage="1"
          flightDistance={300}
          droneName="meofefi"
          hebrewName="מעופפי"
          onClose={() => setSelectedDrone(null)}
        />
      )}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      <Button
        onClick={() => setIsStateDialogOpen(true)}
        style={{ left: 16, position: "absolute", top: 16, zIndex: 1000 }}
        variant="contained"
      >
        View simulation state
      </Button>
      <AddScenerioModal />

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
              backgroundColor: "#f5f5f5",
              borderRadius: 4,
              fontFamily: "monospace",
              fontSize: 13,
              margin: 0,
              maxHeight: "60vh",
              overflow: "auto",
              padding: 16,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {stateJson}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleClock}>
            {isRunning ? "Pause clock" : "Run clock"}
          </Button>
          <select
            aria-label="Simulation speed"
            value={state.speedMultiplier}
            onChange={(event) =>
              setSpeed(Number(event.target.value) as 1 | 2 | 5 | 10)
            }
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
