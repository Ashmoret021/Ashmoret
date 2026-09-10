import { useCallback, useEffect, useRef, useState } from "react";
import { CoordinatesControl } from "./components/CoordinatesControl";
import React from "react";
import { MainLayout } from "./layouts/MainLayout";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import L from "leaflet";
import "./styles/droneStyles.css";
import { useSimulation } from "./simulation/useSimulation";
import { SimulationControls } from "./ui/SimulationControls";
import { SimulationStats } from "./ui/SimulationStats";
import { Drone, DroneType } from "../../types/types";
import DroneModal from "./components/DroneModal/DroneModal";
import { DefenseSide } from "./components/DefenseSide/defenseSide";
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
import { MapView } from "./ui/MapView";
import { EventLog } from "./ui/EventLog";
import {
  appendLog,
  finishClock,
  getState,
  loadScenario,
  onTick,
  setState,
  stopClock,
} from "./simulation/SimulationContext";
import { sampleScenario } from "./simulation/sampleScenario";
import { activateWaitingThreats } from "./simulation/ThreatEngine";
import { LeafletRenderer } from "./map/LeafletRenderer";
import { visualEventQueue } from "./visual/VisualEventQueue";
import { processEngagementDecision } from "./visual/VisualEventBuilder";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { algorithmClient } from "./algorithm/AlgorithmClient";
import { WorldSnapshotBuilder } from "./algorithm/WorldSnapshotBuilder";

export const App = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const { state, pauseClock, resumeClock, setSpeed, startClock } =
    useSimulation();
  const rendererRef = useRef<LeafletRenderer | null>(null);
  const engagedDronesRef = useRef<Set<number>>(new Set());
  const [layers, setLayers] = useState<string[]>(["🗺️ מפה רגילה"]);
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [showMainAdditionalComponents, setShowMainAdditionalComponents] =
    useState<boolean>(true);

  const tickIdRef = useRef<number>(0);
  const lastApiTickSimTimeRef = useRef<number>(0); // Start at 0 so first API call fires at simTime≥1.0 (after threats have moved)
  const pendingApiCallRef = useRef<boolean>(false);
  // Monotonically-increasing counter, incremented every time the simulation
  // is reset. Async algorithm callbacks capture this at call time and skip
  // processing if the generation has changed (stale response guard).
  const simulationGenerationRef = useRef<number>(0);

  // ── Attack Side (wave placement builder) state ─────────────────────────
  const [attackModalOpen, setAttackModalOpen] = useState(false);
  const [defenseModalOpen, setDefenseModalOpen] = useState(false);
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(
    () => {
      return storageService.getActiveScenarioId();
    },
  );
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
  const [placedDrones, setPlacedDrones] = useState<PlacedDrone[]>(() => {
    return storageService.getStoredDrones();
  });
  const [placingWaveId, setPlacingWaveId] = useState<number | null>(null);
  const [highlightedDroneId, setHighlightedDroneId] = useState<string | null>(
    null,
  );
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((curr) => (curr?.message === message ? null : curr));
      }, 4000);
    },
    [],
  );

  // Persist waves on change
  useEffect(() => {
    storageService.saveStoredWaves(waves);
  }, [waves]);

  // Persist metadata on change
  useEffect(() => {
    storageService.saveStoredMetadata({ attackName, attackDescription });
  }, [attackName, attackDescription]);

  useEffect(() => {
    // ── Simulation Tick Processor ──────────────────────────────────────────
    const unsubscribe = onTick((_deltaTime, simTime) => {
      const state = getState();
      const { threats, status } = state;
      if (status !== "running") return;

      let changed = false;
      let updatedThreats = { ...threats };

      // --- Dev 1: Threat activation + movement ---
      const prevThreats = updatedThreats;

      // A. Activate threats whose startTime has arrived (via ThreatEngine)
      updatedThreats = activateWaitingThreats(updatedThreats, simTime);

      // Log newly activated threats
      for (const [idStr, t] of Object.entries(updatedThreats)) {
        if (t.logicalStatus === 'active' && prevThreats[Number(idStr)]?.logicalStatus === 'waiting') {
          appendLog('detection', 'זיהוי איום', `איום #${idStr} זוהה באוויר`, t.route[0]);
        }
      }

      // B. Advance positions using fixed 40s flight duration (matches original behavior)
      const flightDuration = 40;
      const next = { ...updatedThreats };
      for (const [idStr, threat] of Object.entries(updatedThreats)) {
        if (threat.logicalStatus !== 'active' && threat.logicalStatus !== 'interceptPending') continue;
        if (!threat.route || threat.route.length < 2) continue;

        const elapsed = simTime - threat.startTime;
        if (elapsed < 0) continue;

        const progress = Math.min(1, elapsed / flightDuration);
        const start = threat.route[0];
        const end = threat.route[threat.route.length - 1];
        const location = {
          latitude: start.latitude + (end.latitude - start.latitude) * progress,
          longitude: start.longitude + (end.longitude - start.longitude) * progress,
          asl: start.asl + (end.asl - start.asl) * progress,
          agl: start.agl + (end.agl - start.agl) * progress,
        };
        next[Number(idStr)] = { ...threat, progress, location };
      }
      updatedThreats = next;

      // C. Detect newly-impacted threats (progress reached 1) and fire impact events
      for (const [idStr, t] of Object.entries(updatedThreats)) {
        const id = Number(idStr);
        const prev = prevThreats[id];
        if (
          t.progress >= 1 &&
          t.logicalStatus !== 'intercepted' &&
          t.logicalStatus !== 'impacted' &&
          prev?.logicalStatus !== 'impacted'
        ) {
          updatedThreats = {
            ...updatedThreats,
            [id]: { ...t, logicalStatus: 'impacted' },
          };

          visualEventQueue.enqueue({
            id: `evt-impact-${id}`,
            type: 'impact',
            startTime: simTime,
            targetId: `איום ${id}`,
            position: t.location,
            status: 'pending',
          });

          appendLog(
            'impact',
            'פגיעה בשטח',
            `איום #${id} (סוג: ${t.type ?? 'אויב'}) פגע בשטח`,
            t.location,
          );
        }
      }

      changed = updatedThreats !== prevThreats;
      // --- End movement ---

      if (changed) {
        setState({ threats: updatedThreats });
      }

      // C. Algorithm API Step (fired once per 1 second of simulation time)
      if (
        !pendingApiCallRef.current &&
        simTime - lastApiTickSimTimeRef.current >= 1.0
      ) {
        lastApiTickSimTimeRef.current = simTime;
        pendingApiCallRef.current = true;
        tickIdRef.current += 1;

        const snapshot = WorldSnapshotBuilder.buildSnapshot(
          getState(),
          tickIdRef.current,
        );

        // Capture current generation — if it changes before this promise resolves,
        // the scenario was switched/reset and we should discard the response.
        const capturedGeneration = simulationGenerationRef.current;

        algorithmClient.step(snapshot).then((response) => {
          pendingApiCallRef.current = false;
          // Guard: discard stale results from a previous simulation run
          if (capturedGeneration !== simulationGenerationRef.current) return;
          if (!response || !response.engagements) return;

          const currentState = getState();
          const nextThreats = { ...currentState.threats };
          let threatsStateUpdated = false;

          for (const decision of response.engagements) {
            const targetIdNum = Number(decision.targetId);
            if (
              !engagedDronesRef.current.has(targetIdNum) &&
              nextThreats[targetIdNum]?.logicalStatus === "active"
            ) {
              engagedDronesRef.current.add(targetIdNum);
              nextThreats[targetIdNum] = {
                ...nextThreats[targetIdNum],
                logicalStatus: "interceptPending",
              };
              threatsStateUpdated = true;

              const bundle = processEngagementDecision(decision, currentState);
              if (bundle) {
                visualEventQueue.enqueue(bundle.visualEvent);
                rendererRef.current?.registerInterceptorVisualState(
                  bundle.interceptorState,
                );

                appendLog(
                  "launch",
                  "שיגור מיירט",
                  `מיירט ${decision.interceptorType} שוגר מסוללה #${decision.defenseSystemId} לעבר איום #${decision.targetId}`,
                  bundle.interceptorState.startPosition,
                );

                const arrivalSimTime = simTime + 3;
                const checkRemoval = onTick((_dt, currentSimTime) => {
                  if (currentSimTime >= arrivalSimTime) {
                    const s = getState();
                    if (s.threats[targetIdNum]) {
                      const updated = {
                        ...s.threats,
                        [targetIdNum]: {
                          ...s.threats[targetIdNum],
                          logicalStatus: "intercepted" as const,
                        },
                      };
                      setState({ threats: updated });

                      appendLog(
                        "interception",
                        "יירוט מוצלח",
                        `איום #${targetIdNum} (סוג: ${s.threats[targetIdNum].type ?? "אויב"}) יורט בהצלחה`,
                        s.threats[targetIdNum].location,
                      );
                    }
                    checkRemoval();
                  }
                });
              }
            }
          }

          if (threatsStateUpdated) {
            setState({ threats: nextThreats });
          }
        });
      }

      const allValues = Object.values(updatedThreats);
      const allDone =
        allValues.length > 0 &&
        allValues.every(
          (t) =>
            t.logicalStatus === "intercepted" || t.logicalStatus === "impacted",
        );
      if (allDone && state.status === "running") {
        finishClock();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleMapReady = useCallback((map: L.Map) => {
    setMap(map);
    mapInstanceRef.current = map;
    const renderer = new LeafletRenderer(map);
    rendererRef.current = renderer;

    renderer.initDefenseSystems();
    renderer.start();
    (window as any).__leafletRenderer = renderer;
    (window as any).__clearEngagedDrones = () => engagedDronesRef.current.clear();
    // Full simulation state reset — called by MainLayout on scenario switch / restart
    (window as any).__resetSimulationRefs = () => {
      simulationGenerationRef.current += 1; // invalidate any in-flight async callbacks
      tickIdRef.current = 0;
      lastApiTickSimTimeRef.current = 0;
      pendingApiCallRef.current = false;
      engagedDronesRef.current.clear();
      // @ts-ignore - interceptorOutcomesRef added by Dev 2
      if (typeof interceptorOutcomesRef !== "undefined" && interceptorOutcomesRef?.current) {
        // @ts-ignore
        interceptorOutcomesRef.current = {};
      }
    };

    // Load initial scenario so map isn't empty on page load
    loadScenario(sampleScenario);
    renderer.initDefenseSystems();

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Map layer controls and GeoJSON overlays from dev
    const streetLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      },
    );
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles &copy; Esri" },
    );
    const darkLayer = L.tileLayer(
      "https://tiles.stadiamaps.com/tiles/stamen_toner_dark/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 20,
        attribution: "&copy; Stadia Maps &copy; OpenStreetMap",
      },
    );

    darkLayer.addTo(map);

    const baseMaps = {
      "🌙 מפה כהה": darkLayer,
      "🗺️ מפה רגילה": streetLayer,
      "🛰️ צילום לווייני": satelliteLayer,
    };

    const layerControl = L.control
      .layers(baseMaps, undefined, { position: "topright" })
      .addTo(map);

    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on("mouseout", () => {
      setCoords(null);
    });

    const baseLayerNames = Object.keys(baseMaps);

    const container = layerControl.getContainer();

    if (container) {
      map.getContainer().appendChild(container);

      Object.assign(container.style, {
        position: "absolute",
        top: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        margin: "0",
        zIndex: "800",
      });
    }

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
  }, []);

  const handleRestart = useCallback(() => {
    stopClock();
    algorithmClient.reset();
    simulationGenerationRef.current += 1; // invalidate any in-flight async callbacks
    tickIdRef.current = 0;
    lastApiTickSimTimeRef.current = 0;
    pendingApiCallRef.current = false;
    engagedDronesRef.current.clear();
    // @ts-ignore - interceptorOutcomesRef added by Dev 2
    if (typeof interceptorOutcomesRef !== "undefined" && interceptorOutcomesRef?.current) {
      // @ts-ignore
      interceptorOutcomesRef.current = {};
    }
    visualEventQueue.clear();

    const renderer = rendererRef.current;
    if (renderer) {
      renderer.resetVisuals();
    }

    loadScenario(sampleScenario);

    if (renderer) {
      renderer.initDefenseSystems();
    }
    startClock();
  }, [startClock]);
  // NOTE: App.handleRestart is only used as fallback when no onRestart prop is
  // provided. The actual restart path goes through MainLayout.handleRestart,
  // which uses window.__resetSimulationRefs to reset App-level refs.

  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.stop();
        rendererRef.current = null;
      }
      markersLayerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, []);

  // ── Attack Side (wave placement builder) handlers ─────────────────────────

  // Drone focus / centering action
  const handleFocusDrone = useCallback(
    (droneId: string) => {
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
    },
    [placedDrones],
  );

  // Request Delete Single Drone (with confirmation modal)
  const handleDeleteDroneRequestById = useCallback(
    (droneId: string) => {
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
    },
    [placedDrones, showToast],
  );

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
        (id) => handleFocusDrone(id),
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
  }, [
    placedDrones,
    highlightedDroneId,
    handleDeleteDroneRequestById,
    handleFocusDrone,
  ]);

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
      const placedForWave = placedDrones.filter(
        (d) => d.waveId === activeWave.id,
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

      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));

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
        const droneId = `DRN-W${activeWave.id}-${String(nextNum).padStart(2, "0")}-${uniqueSuffix}`;
        const droneName = `רחפן ${nextNum} (גל ${activeWave.id})`;

        // Slight offset for multi-placement batch items
        const offsetRadius =
          isBatch && batchCount > 1 ? 0.0003 * Math.sqrt(i) : 0;
        const offsetAngle =
          isBatch && batchCount > 1 ? (i * 2 * Math.PI) / batchCount : 0;
        const droneLat = Number(
          (lat + offsetRadius * Math.cos(offsetAngle)).toFixed(6),
        );
        const droneLng = Number(
          (lng + offsetRadius * Math.sin(offsetAngle)).toFixed(6),
        );

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

    map.on("click", onMapClick);

    return () => {
      map.off("click", onMapClick);
    };
  }, [placingWaveId, waves, placedDrones, showToast]);

  // Scenario Management Callbacks
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
    currentScenarioId,
    attackName,
    attackDescription,
    waves,
    placedDrones,
    showToast,
  ]);

  // Active wave calculation
  const activePlacingWave =
    placingWaveId !== null
      ? waves.find((w) => w.id === placingWaveId) || null
      : null;
  const activePlacedCount = activePlacingWave
    ? placedDrones.filter((d) => d.waveId === activePlacingWave.id).length
    : 0;
  const activeRequiredCount = activePlacingWave
    ? Number(activePlacingWave.quantity) || 0
    : 0;
  const activeRemainingCount = Math.max(
    0,
    activeRequiredCount - activePlacedCount,
  );

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

  const handleStartSimulation = () => {
    console.log("Simulation initiated");
  };

  return (
    <>
      <div
        className={placingWaveId !== null ? "placement-active-cursor" : ""}
        style={{
          height: "100vh",
          position: "relative",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        <MainLayout
          scenarioName="רב-זירתי - צפון ומזרח"
          simId="SIM-01"
          onStartSimulation={handleStartSimulation}
          handleMapReady={handleMapReady}
          setShowMainAdditionalComponents={setShowMainAdditionalComponents}
          onAddDroneGroup={() => setAttackModalOpen(true)}
          onAddInterceptorGroup={() => setDefenseModalOpen(true)}
        />
        <CoordinatesControl coords={coords} />
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
        {showMainAdditionalComponents && (
          <>
            <EventLog />
            <SimulationStats />
            <SimulationControls onRestart={handleRestart} />
            <DefenseSide
              map={map}
              open={defenseModalOpen}
              onClose={() => setDefenseModalOpen(false)}
            />

            {/* Floating Placement HUD for attack-side drone placement */}
            {activePlacingWave && (
              <PlacementHUD
                activeWave={activePlacingWave}
                placedCount={activePlacedCount}
                remainingCount={activeRemainingCount}
                totalRequired={activeRequiredCount}
                onFinish={() => setPlacingWaveId(null)}
                onOpenForm={() => {
                  setPlacingWaveId(null);
                  setAttackModalOpen(true);
                }}
              />
            )}
          </>
        )}

        {/* Attack Waves Configuration Modal */}
        <AttackSide
          open={attackModalOpen}
          onClose={() => setAttackModalOpen(false)}
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

        {/* Attack-side toast notifications */}
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
    </>
  );
};
