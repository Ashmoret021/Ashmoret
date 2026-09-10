import L from "leaflet";
import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createWave } from "../constants/droneConstants";
import { storageService } from "../services/storageService";
import type { DroneWave, PlacedDrone, Scenario } from "../types/drone";
import {
  createDroneDivIcon,
  createDronePopupContent,
} from "../utils/droneMarker";
import type { ToastType } from "../components/ToastNotification";

interface DeleteModalState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface StartPlacementOptions {
  mode: "single" | "batch";
  count: number;
}

interface UseAttackScenarioBuilderOptions {
  mapInstanceRef: RefObject<L.Map | null>;
  markersLayerRef: RefObject<L.LayerGroup | null>;
  markersMapRef: RefObject<Map<string, L.Marker>>;
  showToast: (message: string, type?: ToastType) => void;
}

const emptyDeleteModal: DeleteModalState = {
  open: false,
  title: "",
  message: "",
  onConfirm: () => {},
};

export const useAttackScenarioBuilder = ({
  mapInstanceRef,
  markersLayerRef,
  markersMapRef,
  showToast,
}: UseAttackScenarioBuilderOptions) => {
  const [attackModalOpen, setAttackModalOpen] = useState(false);
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(
    () => storageService.getActiveScenarioId(),
  );
  const [attackName, setAttackName] = useState<string>(
    () => storageService.getStoredMetadata()?.attackName || "",
  );
  const [attackDescription, setAttackDescription] = useState<string>(
    () => storageService.getStoredMetadata()?.attackDescription || "",
  );
  const [waves, setWaves] = useState<DroneWave[]>(() => {
    const saved = storageService.getStoredWaves();
    return saved && saved.length > 0 ? saved : [createWave(1)];
  });
  const [placedDrones, setPlacedDrones] = useState<PlacedDrone[]>(() =>
    storageService.getStoredDrones(),
  );
  const [placingWaveId, setPlacingWaveId] = useState<number | null>(null);
  const [highlightedDroneId, setHighlightedDroneId] = useState<string | null>(
    null,
  );
  const [deleteModal, setDeleteModal] =
    useState<DeleteModalState>(emptyDeleteModal);

  useEffect(() => {
    storageService.saveStoredWaves(waves);
  }, [waves]);

  useEffect(() => {
    storageService.saveStoredMetadata({ attackName, attackDescription });
  }, [attackName, attackDescription]);

  const handleFocusDrone = useCallback(
    (droneId: string) => {
      const drone = placedDrones.find((item) => item.id === droneId);
      const map = mapInstanceRef.current;
      if (!drone || !map) return;

      map.flyTo([drone.latitude, drone.longitude], 12, {
        animate: true,
        duration: 1,
      });

      setHighlightedDroneId(droneId);

      setTimeout(() => {
        markersMapRef.current?.get(droneId)?.openPopup();
      }, 400);

      setTimeout(() => {
        setHighlightedDroneId((current) =>
          current === droneId ? null : current,
        );
      }, 5000);
    },
    [mapInstanceRef, markersMapRef, placedDrones],
  );

  const handleDeleteDroneRequestById = useCallback(
    (droneId: string) => {
      const drone = placedDrones.find((item) => item.id === droneId);
      if (!drone) return;

      setDeleteModal({
        open: true,
        title: `מחיקת רחפן ${drone.name || drone.id}`,
        message: `האם אתה בטוח שברצונך למחוק את רחפן ${drone.id} (גל ${drone.waveId}) מהמפה? פעולה זו תפנה מקום להצבת רחפן נוסף.`,
        onConfirm: () => {
          setPlacedDrones((previous) => {
            const updated = previous.filter((item) => item.id !== droneId);
            storageService.saveStoredDrones(updated);
            return updated;
          });
          setDeleteModal((current) => ({ ...current, open: false }));
          showToast(`רחפן ${drone.id} נמחק בהצלחה`, "success");
        },
      });
    },
    [placedDrones, showToast],
  );

  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();
    markersMapRef.current?.clear();

    placedDrones.forEach((drone) => {
      const isHighlighted = highlightedDroneId === drone.id;
      const marker = L.marker([drone.latitude, drone.longitude], {
        icon: createDroneDivIcon(drone, isHighlighted),
        title: `${drone.id} (${drone.droneType})`,
      });

      marker.bindPopup(
        createDronePopupContent(
          drone,
          (id) => handleDeleteDroneRequestById(id),
          (id) => handleFocusDrone(id),
        ),
        {
          className: "tactical-leaflet-popup",
          closeButton: true,
        },
      );

      marker.addTo(markersLayer);
      markersMapRef.current?.set(drone.id, marker);

      if (isHighlighted) {
        marker.openPopup();
      }
    });
  }, [
    handleDeleteDroneRequestById,
    handleFocusDrone,
    highlightedDroneId,
    markersLayerRef,
    markersMapRef,
    placedDrones,
  ]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || placingWaveId === null) return;

    const activeWave = waves.find((wave) => wave.id === placingWaveId);
    if (!activeWave) {
      setPlacingWaveId(null);
      return;
    }

    const handleMapClick = (event: L.LeafletMouseEvent) => {
      const placedForWave = placedDrones.filter(
        (drone) => drone.waveId === activeWave.id,
      );
      const required = Number(activeWave.quantity) || 0;

      if (placedForWave.length >= required) {
        showToast(
          `הושלמה הצבת כל ${required} הרחפנים לגל ${activeWave.id}. לא ניתן לחרוג מהכמות המוגדרת.`,
          "error",
        );
        setPlacingWaveId(null);
        return;
      }

      const lat = Number(event.latlng.lat.toFixed(6));
      const lng = Number(event.latlng.lng.toFixed(6));
      const isBatch = activeWave.placementMode === "batch";
      const batchCount = isBatch
        ? Math.min(activeWave.batchSize || 1, required - placedForWave.length)
        : 1;

      const newDronesToPlace: PlacedDrone[] = [];

      for (let i = 0; i < batchCount; i++) {
        const nextNum = placedForWave.length + 1 + i;
        const uniqueSuffix = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();
        const offsetRadius =
          isBatch && batchCount > 1 ? 0.0003 * Math.sqrt(i) : 0;
        const offsetAngle =
          isBatch && batchCount > 1 ? (i * 2 * Math.PI) / batchCount : 0;

        newDronesToPlace.push({
          id: `DRN-W${activeWave.id}-${String(nextNum).padStart(2, "0")}-${uniqueSuffix}`,
          name: `רחפן ${nextNum} (גל ${activeWave.id})`,
          waveId: activeWave.id,
          waveIndex: waves.findIndex((wave) => wave.id === activeWave.id) + 1,
          droneType: activeWave.droneType,
          latitude: Number(
            (lat + offsetRadius * Math.cos(offsetAngle)).toFixed(6),
          ),
          longitude: Number(
            (lng + offsetRadius * Math.sin(offsetAngle)).toFixed(6),
          ),
          altitude: activeWave.altitude || 100,
          heading: activeWave.angle || 45,
          status: "ready",
          placedAt: new Date().toISOString(),
        });
      }

      const updatedDrones = [...placedDrones, ...newDronesToPlace];
      setPlacedDrones(updatedDrones);
      storageService.saveStoredDrones(updatedDrones);

      const remaining =
        required - (placedForWave.length + newDronesToPlace.length);

      if (remaining <= 0) {
        showToast(
          `כל ${required} הרחפנים עבור גל ${activeWave.id} הוצבו בהצלחה!`,
          "success",
        );
        setPlacingWaveId(null);
      } else {
        showToast(
          batchCount > 1
            ? `הוצבו ${batchCount} רחפנים במקבץ! נותרו עוד ${remaining} רחפנים להצבה.`
            : `רחפן ${newDronesToPlace[0].name} מוקם בהצלחה! נותרו עוד ${remaining} רחפנים להצבה.`,
          "success",
        );
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [mapInstanceRef, placedDrones, placingWaveId, showToast, waves]);

  const handleStartPlacement = useCallback(
    (waveId: string | number, options?: StartPlacementOptions) => {
      const numericWaveId = Number(waveId);
      if (!Number.isFinite(numericWaveId)) {
        showToast("מזהה גל לא תקין.", "error");
        return;
      }

      setPlacingWaveId(numericWaveId);

      if (options) {
        setWaves((previous) =>
          previous.map((wave) =>
            String(wave.id) === String(waveId)
              ? {
                  ...wave,
                  placementMode: options.mode,
                  batchSize: options.count,
                }
              : wave,
          ),
        );
      }

      showToast(
        options?.mode === "batch"
          ? `מצב הצבת מקבץ פעיל עבור גל ${numericWaveId}. יוצבו ${options.count} רחפנים בכל לחיצה.`
          : `מצב הצבה פעיל עבור גל ${numericWaveId}. לחץ על המפה להצבת רחפן.`,
        "info",
      );
    },
    [showToast],
  );

  const handleSaveScenario = useCallback(() => {
    const scenarioId =
      currentScenarioId || `SCN-${Date.now().toString().slice(-6)}`;
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
    storageService.saveStoredMetadata({
      attackName: "",
      attackDescription: "",
    });

    setAttackModalOpen(false);
    showToast(
      `תרחיש "${scenarioName}" נשמר בהצלחה עם ${scenarioToSave.drones.length} רחפנים. הרחפנים הוסרו מהמפה הפעילה.`,
      "success",
    );
  }, [
    attackDescription,
    attackName,
    currentScenarioId,
    placedDrones,
    showToast,
    waves,
  ]);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal((current) => ({ ...current, open: false }));
  }, []);

  const activePlacement = useMemo(() => {
    const activeWave =
      placingWaveId !== null
        ? waves.find((wave) => wave.id === placingWaveId) || null
        : null;
    const placedCount = activeWave
      ? placedDrones.filter((drone) => drone.waveId === activeWave.id).length
      : 0;
    const totalRequired = activeWave ? Number(activeWave.quantity) || 0 : 0;

    return {
      activeWave,
      placedCount,
      remainingCount: Math.max(0, totalRequired - placedCount),
      totalRequired,
    };
  }, [placedDrones, placingWaveId, waves]);

  return {
    activePlacement,
    attackDescription,
    attackModalOpen,
    attackName,
    closeDeleteModal,
    deleteModal,
    handleSaveScenario,
    handleStartPlacement,
    placedDrones,
    placingWaveId,
    setAttackDescription,
    setAttackModalOpen,
    setAttackName,
    setPlacingWaveId,
    setWaves,
    waves,
  };
};
