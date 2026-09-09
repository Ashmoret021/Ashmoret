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
import axios from "axios";
import { SimulationControls } from "./ui/SimulationControls";
import { SimulationStats } from "./ui/SimulationStats";
import { Drone, DroneType } from "./types/types";
import DroneModal from "./components/DroneModal/DroneModal";

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const { state, pauseClock, resumeClock, setSpeed, startClock } =
    useSimulation();
  const [layers, setLayers] = useState<string[]>(["🗺️ מפה רגילה"]);

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

    const layerControl = L.control.layers(baseMaps).addTo(map);

    layerControl.getContainer()?.classList.add("top-center-layer-control");

    const baseLayerNames = Object.keys(baseMaps);

    map.on("baselayerchange", (e: L.LayersControlEvent) => {
      setLayers((prev) => [
        ...prev.filter((name) => !baseLayerNames.includes(name)),
        e.name,
      ]);
    });

    map.on("overlayadd", (e: L.LayersControlEvent) => {
      setLayers((prev) => [...prev.filter((name) => name !== e.name), e.name]);
    });

    map.on("overlayremove", (e: L.LayersControlEvent) => {
      setLayers((prev) => prev.filter((name) => name !== e.name));
    });

    axios
      .get("/CITIES.geojson")
      .then((response) => {
        const citiesLayer = L.geoJSON(response.data, {
          interactive: false,
          style: {
            color: "#4196f8",
            fillColor: "#4196f8",
            fillOpacity: 0.35,
          },
        });

        layerControl.addOverlay(citiesLayer, "🏙️ ערים");
      })
      .catch((error) => {
        console.error("Failed to load cities layer:", error);
      });

    axios
      .get("/SENSITIVES.geojson")
      .then((response) => {
        const sensitivesLayer = L.geoJSON(response.data, {
          style: {
            color: "#e53935",
            weight: 2,
            fillColor: "#e53935",
            fillOpacity: 0.35,
          },
          onEachFeature: (feature, layer) => {
            const name =
              feature.properties?.HEB_NAME || feature.properties?.CITY_NAME;
            const category = feature.properties?.HEB_CATEGORY;
            if (name) {
              layer.bindPopup(
                `<strong>${name}</strong>${category ? `<br/>סוג: ${category}` : ""}`,
              );
            }
          },
        });

        map.on("overlayadd", (e: L.LayersControlEvent) => {
          if (e.name === "🛡️ מיקומים רגישים") {
            sensitivesLayer.bringToFront();
          }
        });

        layerControl.addOverlay(sensitivesLayer, "🛡️ אתרים רגישים");
      })
      .catch((error) => {
        console.error("Failed to load sensitives layer:", error);
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
    <>
      <style>
        {`
          .top-center-layer-control {
            position: fixed !important;
            top: 20px !important;
            left: 50% !important;
          }
        `}
      </style>
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
    </>
  );
}
