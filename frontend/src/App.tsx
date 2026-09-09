import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles/droneStyles.css";

import { TemporaryAddButton } from "./components/TemporaryAddButton";
import { AttackSide } from "./components/Attackside";
import { createWave } from "./constants/droneConstants";
import { PlacementHUD } from "./components/PlacementHUD";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { PlacedDrone, DroneWave, Scenario } from "./types/drone";
import { storageService } from "./services/storageService";
import { createDroneDivIcon, createDronePopupContent } from "./utils/droneMarker";

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

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

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

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

    // Open popup
    setTimeout(() => {
      const marker = markersMapRef.current.get(droneId);
      if (marker) {
        marker.openPopup();
      }
    }, 400);

    // Auto-clear highlight after 5s
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
      // Re-read current placed count for this wave
      const placedForWave = placedDrones.filter((d) => d.waveId === activeWave.id);
      const required = Number(activeWave.quantity) || 0;

      // Validate quantity defined in Forms
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

      const nextNum = placedForWave.length + 1;
      const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const droneId = `DRN-W${activeWave.id}-${String(nextNum).padStart(2, "0")}-${uniqueSuffix}`;
      const droneName = `רחפן ${nextNum} (גל ${activeWave.id})`;

      const newDrone: PlacedDrone = {
        id: droneId,
        name: droneName,
        waveId: activeWave.id,
        waveIndex: waves.findIndex((w) => w.id === activeWave.id) + 1,
        droneType: activeWave.droneType,
        latitude: lat,
        longitude: lng,
        altitude: activeWave.altitude || 100,
        heading: activeWave.angle || 45,
        status: "ready",
        placedAt: new Date().toISOString(),
      };

      const updatedDrones = [...placedDrones, newDrone];
      setPlacedDrones(updatedDrones);
      storageService.saveStoredDrones(updatedDrones);

      const remaining = required - (placedForWave.length + 1);

      if (remaining <= 0) {
        showToast(
          `כל ${required} הרחפנים עבור גל ${activeWave.id} הוצבו בהצלחה!`,
          "success"
        );
        setPlacingWaveId(null);
      } else {
        showToast(
          `רחפן ${newDrone.name} מוקם בהצלחה! נותרו עוד ${remaining} רחפנים להצבה.`,
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

    // Requirement 2: After the scenario is successfully saved, remove/hide all drone markers from the current map!
    setPlacedDrones([]);
    storageService.saveStoredDrones([]);

    // Reset current form to clean state
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



  // Active wave being placed
  const activePlacingWave =
    placingWaveId !== null ? waves.find((w) => w.id === placingWaveId) || null : null;
  const activePlacedCount = activePlacingWave
    ? placedDrones.filter((d) => d.waveId === activePlacingWave.id).length
    : 0;
  const activeRequiredCount = activePlacingWave ? Number(activePlacingWave.quantity) || 0 : 0;
  const activeRemainingCount = Math.max(0, activeRequiredCount - activePlacedCount);

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
      {/* Existing Leaflet Map */}
      <div
        ref={mapRef}
        style={{
          height: "100vh",
          width: "100vw",
        }}
      />

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

      {/* Temporary + button to open Attack Scenario Modal */}
      {!activePlacingWave && (
        <TemporaryAddButton onClick={() => setModalOpen(true)} />
      )}

      {/* Attack Waves Configuration Modal */}
      <AttackSide
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        waves={waves}
        setWaves={setWaves}
        placedDrones={placedDrones}
        onStartPlacement={(waveId) => {
          setPlacingWaveId(waveId);
          showToast(`מצב הצבה פעיל עבור גל ${waveId}. לחץ על המפה להצבת רחפן.`, "info");
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
