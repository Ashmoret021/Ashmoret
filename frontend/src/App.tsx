import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles/droneStyles.css";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { TemporaryAddButton } from "./components/TemporaryAddButton";
import AttackSide from "./components/Attackside";
import { createWave } from "./constants/droneConstants";
import { PlacementHUD } from "./components/PlacementHUD";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { PlacedDrone, DroneWave, Scenario } from "./types/drone";
import { storageService } from "./services/storageService";
import {
  createDroneDivIcon,
  createDronePopupContent,
} from "./utils/droneMarker";
import { useSimulation } from "./simulation/useSimulation";
import { SimulationControls } from "./ui/SimulationControls";
import { SimulationStats } from "./ui/SimulationStats";

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Container element to render the button portal next to the layer control
  const [buttonContainer, setButtonContainer] = useState<HTMLElement | null>(null);

  // Simulation State & Controls
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const { state, pauseClock, resumeClock, setSpeed, startClock } = useSimulation();

  // Modal & Navigation State
  const [modalOpen, setModalOpen] = useState(false);

  // Current Scenario State
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(() => {
    return storageService.getActiveScenarioId();
  });

  // Attack Scenario & Waves State (persisted)
  const [attackName, setAttackName] = useState<string>(() => {
    return storageService.getStoredMetadata()?.attackName || "";
  });
  const [attackDescription, setAttackDescription] = useState<string>(() => {
    return storageService.getStoredMetadata()?.attackDescription || "";
  });
  const [waves, setWaves] = useState<DroneWave[]>(() => {
    const saved = storageService.getStoredWaves();
    return saved && saved.length > 0 ? saved : [createWave(1)];
  });

  // Placed Drones State (for active scenario on map)
  const [placedDrones, setPlacedDrones] = useState<PlacedDrone[]>(() => {
    return storageService.getStoredDrones();
  });

  // Interactive Placement Mode
  const [placingWaveId, setPlacingWaveId] = useState<number | null>(null);
  const [highlightedDroneId, setHighlightedDroneId] = useState<string | null>(null);

  // Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  // Persist waves on change
  useEffect(() => {
    storageService.saveStoredWaves(waves);
  }, [waves]);

  // Persist metadata on change
  useEffect(() => {
    storageService.saveStoredMetadata({ attackName, attackDescription });
  }, [attackName, attackDescription]);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
    }).setView([31.45, 34.9], 8);

    const streetLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      }
    );

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
      }
    );

    streetLayer.addTo(map);

    const baseMaps = {
      "🗺️ מפה רגילה": streetLayer,
      "🛰️ צילום לווייני": satelliteLayer,
    };

    L.control.layers(baseMaps).addTo(map);

    // Create a horizontal container control positioned at top-right
    const CustomControl = L.Control.extend({
      options: { position: "topright" },
      onAdd: function () {
        const div = L.DomUtil.create("div", "custom-add-button-wrapper");
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.marginRight = "12px";
        div.style.pointerEvents = "auto";
        setButtonContainer(div);
        return div;
      },
    });

    map.addControl(new CustomControl());

    fetch("/CITIES.geojson")
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data).addTo(map);
      })
      .catch((err) => console.error("Error loading CITIES.geojson:", err));

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Drone focus / centering action
  const handleFocusDrone = useCallback((droneId: string) => {
    const drone = placedDrones.find((d) => d.id === droneId);
    if (!drone || !mapInstanceRef.current) return;

    mapInstanceRef.current.flyTo([drone.latitude, drone.longitude], 12, {
      animate: true,
      duration: 1,
    });

    setHighlightedDroneId(droneId);

    setTimeout(() => {
      const marker = markersMapRef.current.get(droneId);
      if (marker) {
        marker.openPopup();
      }
    }, 400);

    setTimeout(() => {
      setHighlightedDroneId((curr) => (curr === droneId ? null : curr));
    }, 5000);
  }, [placedDrones]);

  // Request Delete Single Drone (with confirmation modal)
  const handleDeleteDroneRequestById = useCallback((droneId: string) => {
    const drone = placedDrones.find((d) => d.id === droneId);
    if (!drone) return;

    setDeleteModal({
      open: true,
      title: `מחיקת רחפן ${drone.name || drone.id}`,
      message: `האם אתה בטוח שברצונך למחוק את רחפן ${drone.id} (גל ${drone.waveId}) מהמפה? פעולה זו תפנה מקום להצבת רחפן נוסף.`,
      onConfirm: () => {
        setPlacedDrones((prev) => {
          const updated = prev.filter((d) => d.id !== droneId);
          storageService.saveStoredDrones(updated);
          return updated;
        });
        setDeleteModal((curr) => ({ ...curr, open: false }));
        showToast(`רחפן ${drone.id} נמחק בהצלחה`, "success");
      },
    });
  }, [placedDrones, showToast]);

  // Render & Update Markers on the Leaflet Map
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();
    markersMapRef.current.clear();

    placedDrones.forEach((drone) => {
      const isHighlighted = highlightedDroneId === drone.id;
      const icon = createDroneDivIcon(drone, isHighlighted);
      const marker = L.marker([drone.latitude, drone.longitude], {
        icon,
        title: `${drone.id} (${drone.droneType})`,
      });

      const popupElement = createDronePopupContent(
        drone,
        (id) => handleDeleteDroneRequestById(id),
        (id) => handleFocusDrone(id)
      );

      marker.bindPopup(popupElement, {
        className: "tactical-leaflet-popup",
        closeButton: true,
      });

      marker.addTo(markersLayer);
      markersMapRef.current.set(drone.id, marker);

      if (isHighlighted) {
        marker.openPopup();
      }
    });
  }, [placedDrones, highlightedDroneId, handleDeleteDroneRequestById, handleFocusDrone]);

  // Handle Map Click when in Placement Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || placingWaveId === null) return;

    const activeWave = waves.find((w) => w.id === placingWaveId);
    if (!activeWave) {
      setPlacingWaveId(null);
      return;
    }

    const onMapClick = (e: L.LeafletMouseEvent) => {
      const placedForWave = placedDrones.filter((d) => d.waveId === activeWave.id);
      const required = Number(activeWave.quantity) || 0;

      if (placedForWave.length >= required) {
        showToast(
          `הושלמה הצבת כל ${required} הרחפנים לגל ${activeWave.id}. לא ניתן לחרוג מהכמות המוגדרת.`,
          "error"
        );
        setPlacingWaveId(null);
        return;
      }

      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));

      const isBatch = activeWave.placementMode === "batch";
      const batchCount = isBatch
        ? Math.min(activeWave.batchSize || 1, required - placedForWave.length)
        : 1;

      const newDronesToPlace: PlacedDrone[] = [];

      for (let i = 0; i < batchCount; i++) {
        const nextNum = placedForWave.length + 1 + i;
        const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const droneId = `DRN-W${activeWave.id}-${String(nextNum).padStart(2, "0")}-${uniqueSuffix}`;
        const droneName = `רחפן ${nextNum} (גל ${activeWave.id})`;

        // Slight offset for multi-placement batch items
        const offsetRadius = isBatch && batchCount > 1 ? 0.0003 * Math.sqrt(i) : 0;
        const offsetAngle = isBatch && batchCount > 1 ? (i * 2 * Math.PI) / batchCount : 0;
        const droneLat = Number((lat + offsetRadius * Math.cos(offsetAngle)).toFixed(6));
        const droneLng = Number((lng + offsetRadius * Math.sin(offsetAngle)).toFixed(6));

        newDronesToPlace.push({
          id: droneId,
          name: droneName,
          waveId: activeWave.id,
          waveIndex: waves.findIndex((w) => w.id === activeWave.id) + 1,
          droneType: activeWave.droneType,
          latitude: droneLat,
          longitude: droneLng,
          altitude: activeWave.altitude || 100,
          heading: activeWave.angle || 45,
          status: "ready",
          placedAt: new Date().toISOString(),
        });
      }

      const updatedDrones = [...placedDrones, ...newDronesToPlace];
      setPlacedDrones(updatedDrones);
      storageService.saveStoredDrones(updatedDrones);

      const remaining = required - (placedForWave.length + newDronesToPlace.length);

      if (remaining <= 0) {
        showToast(
          `כל ${required} הרחפנים עבור גל ${activeWave.id} הוצבו בהצלחה!`,
          "success"
        );
        setPlacingWaveId(null);
      } else {
        showToast(
          batchCount > 1
            ? `הוצבו ${batchCount} רחפנים במקבץ! נותרו עוד ${remaining} רחפנים להצבה.`
            : `רחפן ${newDronesToPlace[0].name} מוקם בהצלחה! נותרו עוד ${remaining} רחפנים להצבה.`,
          "success"
        );
      }
    };

    map.on("click", onMapClick);

    return () => {
      map.off("click", onMapClick);
    };
  }, [placingWaveId, waves, placedDrones, showToast]);

  // Scenario Management Callbacks
  const handleSaveScenario = useCallback(() => {
    const scenarioId = currentScenarioId || `SCN-${Date.now().toString().slice(-6)}`;
    const scenarioName =
      attackName.trim() ||
      `תרחיש ${new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;

    const scenarioToSave: Scenario = {
      id: scenarioId,
      name: scenarioName,
      description: attackDescription,
      waves,
      drones: placedDrones,
      savedAt: new Date().toISOString(),
    };

    storageService.saveScenario(scenarioToSave);
    setPlacedDrones([]);
    storageService.saveStoredDrones([]);

    setCurrentScenarioId(null);
    setAttackName("");
    setAttackDescription("");
    setWaves([createWave(1)]);

    storageService.setActiveScenarioId(null);
    storageService.saveStoredWaves([createWave(1)]);
    storageService.saveStoredMetadata({ attackName: "", attackDescription: "" });

    setModalOpen(false);
    showToast(
      `תרחיש "${scenarioName}" נשמר בהצלחה עם ${scenarioToSave.drones.length} רחפנים. הרחפנים הוסרו מהמפה הפעילה.`,
      "success"
    );
  }, [currentScenarioId, attackName, attackDescription, waves, placedDrones, showToast]);

  // Active wave calculation
  const activePlacingWave =
    placingWaveId !== null ? waves.find((w) => w.id === placingWaveId) || null : null;
  const activePlacedCount = activePlacingWave
    ? placedDrones.filter((d) => d.waveId === activePlacingWave.id).length
    : 0;
  const activeRequiredCount = activePlacingWave ? Number(activePlacingWave.quantity) || 0 : 0;
  const activeRemainingCount = Math.max(0, activeRequiredCount - activePlacedCount);

  // Simulation Controls Handlers
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

  return (
    <div
      dir="rtl"
      className={placingWaveId !== null ? "placement-active-cursor" : ""}
      style={{
        height: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Leaflet Map Container */}
      <div
        ref={mapRef}
        style={{
          height: "100vh",
          width: "100vw",
        }}
      />

      {/* Button to view simulation state */}
      <Button
        onClick={() => setIsStateDialogOpen(true)}
        style={{ left: 16, position: "absolute", top: 16, zIndex: 1000 }}
        variant="contained"
      >
        View simulation state
      </Button>

      {/* Simulation Stats HUD */}
      <SimulationStats />

      {/* Simulation Control Bar */}
      <SimulationControls />

      {/* Floating Placement HUD */}
      {activePlacingWave && (
        <PlacementHUD
          activeWave={activePlacingWave}
          placedCount={activePlacedCount}
          remainingCount={activeRemainingCount}
          totalRequired={activeRequiredCount}
          onFinish={() => setPlacingWaveId(null)}
          onOpenForm={() => {
            setPlacingWaveId(null);
            setModalOpen(true);
          }}
        />
      )}

      {/* Render Add Button into Leaflet Control via Portal to ensure side-by-side positioning */}
      {!activePlacingWave &&
        buttonContainer &&
        createPortal(<TemporaryAddButton onClick={() => setModalOpen(true)} />, buttonContainer)}

      {/* Attack Waves Configuration Modal */}
      <AttackSide
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        waves={waves}
        setWaves={setWaves}
        placedDrones={placedDrones}
        onStartPlacement={(waveId, options) => {
          const numericWaveId = Number(waveId);
          if (!Number.isFinite(numericWaveId)) {
            showToast("מזהה גל לא תקין.", "error");
            return;
          }

          setPlacingWaveId(numericWaveId);

          if (options) {
            setWaves((prev) =>
              prev.map((wave) =>
                String(wave.id) === String(waveId)
                  ? {
                      ...wave,
                      placementMode: options.mode,
                      batchSize: options.count,
                    }
                  : wave
              )
            );
          }

          showToast(
            options?.mode === "batch"
              ? `מצב הצבת מקבץ פעיל עבור גל ${numericWaveId}. יוצבו ${options.count} רחפנים בכל לחיצה.`
              : `מצב הצבה פעיל עבור גל ${numericWaveId}. לחץ על המפה להצבת רחפן.`,
            "info"
          );
        }}
        attackName={attackName}
        setAttackName={setAttackName}
        attackDescription={attackDescription}
        setAttackDescription={setAttackDescription}
        onSaveScenario={handleSaveScenario}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        title={deleteModal.title}
        message={deleteModal.message}
        onConfirm={deleteModal.onConfirm}
        onCancel={() => setDeleteModal((curr) => ({ ...curr, open: false }))}
      />

      {/* Simulation State Dialog */}
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

      {/* Notification Toast */}
      {toast && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2500,
            background:
              toast.type === "success"
                ? "linear-gradient(135deg, #065f46 0%, #047857 100%)"
                : toast.type === "error"
                  ? "linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)"
                  : "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            color: "#ffffff",
            padding: "10px 22px",
            borderRadius: 30,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "Inter, Arial, Helvetica, sans-serif",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <span>
            {toast.type === "success"
              ? "✓"
              : toast.type === "error"
                ? "⚠️"
                : "ℹ️"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}