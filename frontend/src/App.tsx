import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
} from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../src/styles/App.css";

import { useSimulation } from "./simulation/useSimulation";
import { SimulationControls } from "./ui/SimulationControls";
import { SimulationStats } from "./ui/SimulationStats";
import { Drone, DroneType } from "./types/types";
import DroneModal from "./components/DroneModal/DroneModal";

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasMarker, setHasMarker] = useState(false);
  const { state, pauseClock, resumeClock, setSpeed, startClock } =
    useSimulation();

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

    const darkLayer = L.tileLayer(
      "https://tiles.stadiamaps.com/tiles/stamen_toner_dark/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> ' +
          '&copy; <a href="https://stamen.com/">Stamen Design</a> ' +
          '&copy; <a href="https://openstreetmap.org/">OpenStreetMap</a>',
      },
    );

    darkLayer.addTo(map);

    const baseMaps = {
      "🌙 מפה כהה": darkLayer,
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
      mapInstanceRef.current = null;
      map.remove();
    };
  }, []);

  const isValidLatitude = (value: string) => {
    if (value === "" || value === "-" || value === ".") {
      return false;
    }

    const number = Number(value);

    return Number.isFinite(number) && number >= -90 && number <= 90;
  };

  const isValidLongitude = (value: string) => {
    if (value === "" || value === "-" || value === ".") {
      return false;
    }

    const number = Number(value);

    return Number.isFinite(number) && number >= -180 && number <= 180;
  };

  const latitudeValid = isValidLatitude(latitude);
  const longitudeValid = isValidLongitude(longitude);

  const coordinatesValid = latitudeValid && longitudeValid;

  const goToCoordinates = () => {
    if (!coordinatesValid) {
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    const map = mapInstanceRef.current;

    if (!map) {
      return;
    }

    map.flyTo([lat, lng], 12, {
      animate: true,
      duration: 1.5,
    });

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    markerRef.current = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`<span style="font-size: 11px;">${lat}/${lng}</span>`, {
        maxWidth: 140,
        minWidth: 80,
        className: "small-popup",
      })
      .openPopup();

    setHasMarker(true);
    setIsSearchOpen(false);
  };

  const handleCoordinateKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      goToCoordinates();
    }
  };

  const removeMarker = () => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    setHasMarker(false);
  };

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
    location: {
      agl: 1,
      asl: 1,
      latitude: 31,
      longitude: 34,
    },
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
      <>
        <div
          style={{
            position: "absolute",
            top: 62,
            right: 8,
            zIndex: 1000,
            display: "flex",
            gap: 8,
          }}
        >
          <Button
            variant="contained"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            sx={{
              minWidth: 48,
              width: 48,
              height: 48,
              borderRadius: 2,
              fontSize: 22,
            }}
          >
            🔍
          </Button>

          {hasMarker && (
            <Button
              variant="contained"
              onClick={removeMarker}
              sx={{
                minWidth: 48,
                width: 48,
                height: 48,
                borderRadius: 2,
                fontSize: 20,
                backgroundColor: "#c62828",

                "&:hover": {
                  backgroundColor: "#b71c1c",
                },
              }}
            >
              🗑️
            </Button>
          )}
        </div>

        {isSearchOpen && (
          <Paper
            elevation={4}
            style={{
              position: "absolute",
              top: 55,
              right: 63,
              zIndex: 1000,
              padding: 12,
              display: "flex",
              gap: 10,
              alignItems: "center",
              borderRadius: 4,
              backgroundColor: "rgba(15, 23, 42, 0.92)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
            }}
          >
            <TextField
              label="Latitude"
              value={latitude}
              onChange={(event) => {
                const value = event.target.value;

                if (/^-?\d*\.?\d*$/.test(value)) {
                  setLatitude(value);
                }
              }}
              onKeyDown={handleCoordinateKeyDown}
              size="small"
              placeholder="31.0461"
              error={latitude !== "" && !latitudeValid}
              helperText={
                latitude !== "" && !latitudeValid
                  ? "Must be between -90 and 90"
                  : ""
              }
              sx={{
                width: 180,
                "& .MuiInputBase-root": {
                  color: "#ffffff",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#90caf9",
                },
                "& .MuiOutlinedInput-root fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.25)",
                },
                "& .MuiFormHelperText-root": {
                  color: "rgba(255, 255, 255, 0.55)",
                },
              }}
            />

            <TextField
              label="Longitude"
              value={longitude}
              onChange={(event) => {
                const value = event.target.value;

                if (/^-?\d*\.?\d*$/.test(value)) {
                  setLongitude(value);
                }
              }}
              onKeyDown={handleCoordinateKeyDown}
              size="small"
              placeholder="34.8516"
              error={longitude !== "" && !longitudeValid}
              helperText={
                longitude !== "" && !longitudeValid
                  ? "Must be between -180 and 180"
                  : ""
              }
              sx={{
                width: 180,
                "& .MuiInputBase-root": {
                  color: "#ffffff",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#90caf9",
                },
                "& .MuiOutlinedInput-root fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.25)",
                },
                "& .MuiFormHelperText-root": {
                  color: "rgba(255, 255, 255, 0.55)",
                },
              }}
            />

            <Button
              variant="contained"
              onClick={goToCoordinates}
              disabled={!coordinatesValid}
              sx={{
                minWidth: 70,
                height: 40,

                "&.Mui-disabled": {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "rgba(255, 255, 255, 0.5)",
                  opacity: 1,
                },
              }}
            >
              Go
            </Button>
          </Paper>
        )}
      </>

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

      <div
        ref={mapRef}
        style={{
          height: "100%",
          width: "100%",
        }}
      />

      <Button
        onClick={() => setIsStateDialogOpen(true)}
        style={{
          left: 16,
          position: "absolute",
          top: 16,
          zIndex: 1000,
        }}
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
  );
}
