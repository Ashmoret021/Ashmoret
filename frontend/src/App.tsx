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
import "leaflet/dist/leaflet.css";
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
import { useCallback, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
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
import { LeafletRenderer } from "./map/LeafletRenderer";
import { visualEventQueue } from "./visual/VisualEventQueue";
import { processEngagementDecision } from "./visual/VisualEventBuilder";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { algorithmClient } from "./algorithm/AlgorithmClient";
import { WorldSnapshotBuilder } from "./algorithm/WorldSnapshotBuilder";
import AircraftSidebar, { AircraftData } from "./components/AircraftSidebar/AircraftSidebar";

export const App = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
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
  const lastApiTickSimTimeRef = useRef<number>(-1);
  const pendingApiCallRef = useRef<boolean>(false);

  // ── Attack Side (wave placement builder) state ─────────────────────────
  const [attackModalOpen, setAttackModalOpen] = useState(false);
  const [defenseModalOpen, setDefenseModalOpen] = useState(false);
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(() => {
    return storageService.getActiveScenarioId();
  });
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

  // TODO: CONNECT TO BACKEND
  const MOCK_PLACED_DRONES: PlacedDrone[] = [
    {
      id: "DRN-W1-01-A1B2",
      name: "רחפן 1 (גל 1)",
      waveId: 1,
      waveIndex: 1,
      droneType: "FalconLongX4",
      latitude: 33.0123,
      longitude: 35.1234,
      altitude: 120,
      heading: 45,
      angle: 45,
      status: "ready",
      placedAt: "2026-09-10T12:00:00.000Z",
    },
    {
      id: "DRN-W1-02-C3D4",
      name: "רחפן 2 (גל 1)",
      waveId: 1,
      waveIndex: 1,
      droneType: "FalconLongX4",
      latitude: 33.0250,
      longitude: 35.1350,
      altitude: 150,
      heading: 60,
      angle: 60,
      status: "ready",
      placedAt: "2026-09-10T12:05:00.000Z",
    },
    {
      id: "DRN-W2-01-E5F6",
      name: "רחפן 1 (גל 2)",
      waveId: 2,
      waveIndex: 2,
      droneType: "Hermes450",
      latitude: 32.8500,
      longitude: 35.2000,
      altitude: 200,
      heading: 90,
      angle: 90,
      status: "ready",
      placedAt: "2026-09-10T12:10:00.000Z",
    },
  ];
  const [placedDrones, setPlacedDrones] = useState<PlacedDrone[]>(() => {
    return MOCK_PLACED_DRONES; 
  });
  const [placingWaveId, setPlacingWaveId] = useState<number | null>(null);
  const [highlightedDroneId, setHighlightedDroneId] = useState<string | null>(null);
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

  // Map placedDrones into AircraftData format for the AircraftSidebar
  const aircraftsData: AircraftData[] = placedDrones.map((d) => ({
    id: d.id,
    name: d.name,
    droneType: d.droneType,
    estimatedAttackQuantity: 1,
    unitCost: 15000,
    totalCost: 15000,
    simulatedThreatNature: "כטב\"ם נכנס",
    flightDistance: 200,
    flightSpeed: 150,
    estimatedDamage: "קשה",
    intelligenceAssessmentLebanon: "איום פעיל",
    intelligenceAssessmentGaza: "נמוך",
  }));

  // Persist waves on change
  useEffect(() => {
    storageService.saveStoredWaves(waves);
  }, [waves]);

  // Persist metadata on change
  useEffect(() => {
    storageService.saveStoredMetadata({ attackName, attackDescription });
  }, [attackName, attackDescription]);

  useEffect(() => {
    // Load default realistic scenario once on mount
    loadScenario(sampleScenario);
    engagedDronesRef.current.clear();
    tickIdRef.current = 0;
    lastApiTickSimTimeRef.current = -1;
    pendingApiCallRef.current = false;

    // ── Simulation Tick Processor ──────────────────────────────────────────
    const unsubscribe = onTick((_deltaTime, simTime) => {
      const state = getState();
      const { threats, status } = state;
      if (status !== "running") return;

      let changed = false;
      const updatedThreats = { ...threats };

      for (const [idStr, threat] of Object.entries(updatedThreats)) {
        const id = Number(idStr);

        // A. Threat Launch
        if (threat.logicalStatus === "waiting" && simTime >= threat.startTime) {
          updatedThreats[id] = {
            ...threat,
            logicalStatus: "active",
            visualStatus: "flying",
            progress: 0,
            location: threat.route[0],
          };
          changed = true;

          appendLog(
            "detection",
            "זיהוי איום",
            `איום #${id} זוהה באוויר`,
            threat.route[0],
          );
        }
        // B. Threat Straight-Line Movement
        else if (
          threat.logicalStatus === "active" ||
          threat.logicalStatus === "interceptPending"
        ) {
          const flightDuration = 40;
          const progress = Math.min(
            1,
            (simTime - threat.startTime) / flightDuration,
          );

          if (threat.route && threat.route.length >= 2) {
            const start = threat.route[0];
            const end = threat.route[threat.route.length - 1];

            const currentPos = {
              latitude:
                start.latitude + (end.latitude - start.latitude) * progress,
              longitude:
                start.longitude + (end.longitude - start.longitude) * progress,
              asl: start.asl + (end.asl - start.asl) * progress,
              agl: start.agl + (end.agl - start.agl) * progress,
            };

            const isImpacted = progress >= 1;
            updatedThreats[id] = {
              ...threat,
              progress,
              location: currentPos,
              logicalStatus: isImpacted ? "impacted" : threat.logicalStatus,
            };
            changed = true;

            if (isImpacted) {
              visualEventQueue.enqueue({
                id: `evt-impact-${id}`,
                type: "impact",
                startTime: simTime,
                targetId: `איום ${id}`,
                position: currentPos,
                status: "pending",
              });

              appendLog(
                "impact",
                "פגיעה בשטח",
                `איום #${id} (סוג: ${threat.type ?? "אויב"}) פגע בשטח`,
                currentPos,
              );

              const allThreats = Object.values(updatedThreats);
              const allDone =
                allThreats.length > 0 &&
                allThreats.every(
                  (t) =>
                    t.logicalStatus === "intercepted" ||
                    t.logicalStatus === "impacted",
                );
              if (allDone) {
                const finishTime = simTime + 1.0;
                const checkFinish = onTick((_dt, time) => {
                  if (time >= finishTime) {
                    finishClock();
                    checkFinish();
                  }
                });
              }
            }
          }

          // C. Simulated Interception Decision
          const timeSinceLaunch = simTime - threat.startTime;
          if (
            timeSinceLaunch >= 5 &&
            !engagedDronesRef.current.has(id) &&
            threat.logicalStatus === "active"
          ) {
            engagedDronesRef.current.add(id);
            updatedThreats[id].logicalStatus = "interceptPending";
            changed = true;

            const launcherId = id === 1 ? "101" : "102";
            const interceptorType = id === 1 ? "DartFoxS" : "SkyLanceM";

            const bundle = processEngagementDecision(
              {
                defenseSystemId: launcherId,
                interceptorType,
                targetId: String(id),
                result: "success",
              },
              state,
            );

            if (bundle) {
              visualEventQueue.enqueue(bundle.visualEvent);
              rendererRef.current?.registerInterceptorVisualState(
                bundle.interceptorState,
              );

              appendLog(
                "launch",
                "שיגור מיירט",
                `מיירט ${interceptorType} שוגר מסוללה #${launcherId} לעבר איום #${id}`,
                bundle.interceptorState.startPosition,
              );

              const arrivalSimTime = simTime + 3;
              const checkRemoval = onTick((_dt, currentSimTime) => {
                if (currentSimTime >= arrivalSimTime) {
                  const s = getState();
                  if (s.threats[id]) {
                    const nextThreats = {
                      ...s.threats,
                      [id]: {
                        ...s.threats[id],
                        logicalStatus: "intercepted" as const,
                      },
                    };
                    setState({ threats: nextThreats });

                    appendLog(
                      "interception",
                      "יירוט מוצלח",
                      `איום #${id} (סוג: ${s.threats[id].type ?? "אויב"}) יורט בהצלחה`,
                      s.threats[id].location,
                    );

                    const allThreats = Object.values(nextThreats);
                    const allDone =
                      allThreats.length > 0 &&
                      allThreats.every(
                        (t) =>
                          t.logicalStatus === "intercepted" ||
                          t.logicalStatus === "impacted",
                      );
                    if (allDone) {
                      const finishTime = currentSimTime + 1.0;
                      const checkFinish = onTick((_dt, time) => {
                        if (time >= finishTime) {
                          finishClock();
                          checkFinish();
                        }
                      });
                    }
                  }
                  checkRemoval();
                }
              });
            }
          }
        }
      }

      if (changed) {
        setState({ threats: updatedThreats });
      }

      // C. Algorithm API Step
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

        algorithmClient.step(snapshot).then((response) => {
          pendingApiCallRef.current = false;
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

      const allThreats = Object.values(updatedThreats);
      const allDone =
        allThreats.length > 0 &&
        allThreats.every(
          (t) =>
            t.logicalStatus === "intercepted" || t.logicalStatus === "impacted",
        );
      if (allDone && status === "running") {
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
    tickIdRef.current = 0;
    lastApiTickSimTimeRef.current = -1;
    pendingApiCallRef.current = false;
    engagedDronesRef.current.clear();
    visualEventQueue.clear();

    const renderer = rendererRef.current;
    if (renderer) {
      renderer.resetVisuals();
    }

    loadScenario(sampleScenario);

    if (renderer) {
      renderer.initDefenseSystems();
    }
  }, []);

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

  // Request Delete Single Drone
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

    setAttackModalOpen(false);
    showToast(
      `תרחיש "${scenarioName}" נשמר בהצלחה עם ${scenarioToSave.drones.length} רחפנים. הרחפנים הוסרו מהמפה הפעילה.`,
      "success"
    );
  }, [currentScenarioId, attackName, attackDescription, waves, placedDrones, showToast]);

  const activePlacingWave =
    placingWaveId !== null ? waves.find((w) => w.id === placingWaveId) || null : null;
  const activePlacedCount = activePlacingWave
    ? placedDrones.filter((d) => d.waveId === activePlacingWave.id).length
    : 0;
  const activeRequiredCount = activePlacingWave ? Number(activePlacingWave.quantity) || 0 : 0;
  const activeRemainingCount = Math.max(0, activeRequiredCount - activePlacedCount);

  const handleStartSimulation = () => {
    console.log("Simulation initiated");
  };

  return (
    <>
      <style>
        {`
          .leaflet-top.leaflet-left {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 12px !important;
            top: 16px !important;
            left: 16px !important;
          }
          .leaflet-top.leaflet-left .leaflet-control {
            margin: 0 !important;
          }
        `}
      </style>

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
            {<SimulationControls onRestart={handleRestart} />}
            <DefenseSide
              map={map}
              open={defenseModalOpen}
              onClose={() => setDefenseModalOpen(false)}
            />

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

        <DeleteConfirmModal
          open={deleteModal.open}
          title={deleteModal.title}
          message={deleteModal.message}
          onConfirm={deleteModal.onConfirm}
          onCancel={() => setDeleteModal((curr) => ({ ...curr, open: false }))}
        />

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