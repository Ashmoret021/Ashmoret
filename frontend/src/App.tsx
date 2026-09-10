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
import { useSimulation } from "./simulation/useSimulation";
import { SimulationControls } from "./ui/SimulationControls";
import { SimulationStats } from "./ui/SimulationStats";
import { Drone, DroneType } from "../../types/types";
import DroneModal from "./components/DroneModal/DroneModal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapView } from "./ui/MapView";
import { EventLog } from "./ui/EventLog";
import {
  appendLog,
  DroneSimState,
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
export const App = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const { state, pauseClock, resumeClock, setSpeed, startClock } =
    useSimulation();
  const rendererRef = useRef<LeafletRenderer | null>(null);
  const engagedDronesRef = useRef<Set<number>>(new Set());
  const [layers, setLayers] = useState<string[]>(["🗺️ מפה רגילה"]);
  const [selectedThreatId, setSelectedThreatId] = useState<number | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [mapMoveTick, setMapMoveTick] = useState(0);

  const tickIdRef = useRef<number>(0);
  const lastApiTickSimTimeRef = useRef<number>(-1);
  const pendingApiCallRef = useRef<boolean>(false);

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
          const flightDuration = 40; // 40 seconds — wider corridor in advanced scenario
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
        // Re-read fresh state to avoid overwriting logicalStatus changes
        // made by checkRemoval callbacks that may have run in this same tick
        const freshThreats = getState().threats;
        for (const [idStr, threat] of Object.entries(updatedThreats)) {
          const freshThreat = freshThreats[Number(idStr)];
          if (freshThreat && freshThreat.logicalStatus === "intercepted") {
            updatedThreats[Number(idStr)] = {
              ...threat,
              logicalStatus: "intercepted",
            };
          }
        }
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
            // Merge with fresh state to avoid overwriting intercepted status
            const freshThreats = getState().threats;
            for (const [idStr, t] of Object.entries(nextThreats)) {
              const freshT = freshThreats[Number(idStr)];
              if (freshT && freshT.logicalStatus === "intercepted") {
                nextThreats[Number(idStr)] = {
                  ...t,
                  logicalStatus: "intercepted",
                };
              }
            }
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
    setMapInstance(map);
    const renderer = new LeafletRenderer(map);
    rendererRef.current = renderer;

    renderer.initDefenseSystems();
    renderer.start();

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
    setSelectedThreatId(null);
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
    };
  }, []);

  // Update modal position on map pan/zoom
  useEffect(() => {
    if (!mapInstance) return;
    const onMove = () => setMapMoveTick((v) => (v + 1) % 10000);
    mapInstance.on("move", onMove);
    mapInstance.on("zoom", onMove);
    return () => {
      mapInstance.off("move", onMove);
      mapInstance.off("zoom", onMove);
    };
  }, [mapInstance]);

  // Click on threat detection
  useEffect(() => {
    if (!mapInstance) return;
    const container = mapInstance.getContainer();

    let startX = 0;
    let startY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      startX = e.clientX;
      startY = e.clientY;
    };

    const handleContainerClick = (e: MouseEvent) => {
      // Ignore if user was dragging/panning the map
      const dragDist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dragDist > 6) return;

      // Ignore if clicking inside the DroneModal card
      const target = e.target as HTMLElement;
      if (target.closest(".drone-dialog-glass")) return;

      const currentState = getState();
      const activeThreats = Object.values(currentState.threats).filter(
        (t) =>
          t.logicalStatus === "active" || t.logicalStatus === "interceptPending",
      );

      if (activeThreats.length === 0) return;

      // 1. Clicked directly on a threat marker in DOM
      const markerEl = target.closest(".ashmoret-marker-threat");
      if (markerEl) {
        const match = markerEl.textContent?.match(/איום\s*(\d+)/);
        if (match) {
          const id = Number(match[1]);
          if (currentState.threats[id]) {
            setSelectedThreatId(id);
            return;
          }
        }
      }

      // 2. Click near a threat marker on screen (within 35px)
      const clickPoint = mapInstance.mouseEventToContainerPoint(e);
      let closestThreat: DroneSimState | null = null;
      let minDistance = Infinity;

      for (const threat of activeThreats) {
        const threatPoint = mapInstance.latLngToContainerPoint([
          threat.location.latitude,
          threat.location.longitude,
        ]);
        const dist = Math.hypot(
          threatPoint.x - clickPoint.x,
          threatPoint.y - clickPoint.y,
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestThreat = threat;
        }
      }

      if (closestThreat && minDistance <= 35) {
        setSelectedThreatId(closestThreat.id);
      } else if (minDistance > 50) {
        // Clicked empty map away from threats
        setSelectedThreatId(null);
      }
    };

    container.addEventListener("mousedown", handleMouseDown, true);
    container.addEventListener("click", handleContainerClick, true);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown, true);
      container.removeEventListener("click", handleContainerClick, true);
    };
  }, [mapInstance]);

  const currentThreat =
    selectedThreatId !== null ? state.threats[selectedThreatId] : null;

  const isThreatNeutralized =
    !currentThreat ||
    currentThreat.logicalStatus === "intercepted" ||
    currentThreat.logicalStatus === "impacted";

  // Auto-close modal when threat is neutralized
  useEffect(() => {
    if (selectedThreatId !== null && isThreatNeutralized) {
      setSelectedThreatId(null);
    }
  }, [selectedThreatId, isThreatNeutralized]);

  const modalPosition = useMemo(() => {
    if (!currentThreat || !mapInstance || isThreatNeutralized) return null;
    const pt = mapInstance.latLngToContainerPoint([
      currentThreat.location.latitude,
      currentThreat.location.longitude,
    ]);
    return { x: pt.x, y: pt.y };
  }, [currentThreat, mapInstance, isThreatNeutralized, mapMoveTick]);

  const getDroneHebrewName = (type: DroneType): string => {
    switch (type) {
      case DroneType.FalconLongX4:
        return "בז ארוך טווח";
      case DroneType.LoadBeeM2:
        return "דבורת מטען M2";
      case DroneType.NanoSwarmQ9:
        return "נחיל ננו Q9";
      case DroneType.SkyMiteC7:
        return "קרדית שמיים C7";
      default:
        return "רחפן תקיפה";
    }
  };

  const getEstimatedDamage = (type: DroneType): string => {
    switch (type) {
      case DroneType.FalconLongX4:
        return 'קריטי — ראש קרב כבד (150 ק"ג)';
      case DroneType.LoadBeeM2:
        return "גבוה — מטען רסס כפול";
      case DroneType.NanoSwarmQ9:
        return "בינוני — פגיעה מערכתית בריכוז";
      case DroneType.SkyMiteC7:
        return 'נקודתי — רש"ק חודר מוקטן';
      default:
        return "גבוה";
    }
  };

  const calculateFlightDistance = (threat: DroneSimState): string => {
    if (threat.route && threat.route.length >= 2) {
      const end = threat.route[threat.route.length - 1];
      const R = 6371; // km
      const dLat = ((end.latitude - threat.location.latitude) * Math.PI) / 180;
      const dLon = ((end.longitude - threat.location.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((threat.location.latitude * Math.PI) / 180) *
          Math.cos((end.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = Math.max(1, Math.round(R * c));
      return `${dist} ק"מ`;
    }
    return '250 ק"מ';
  };

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
        />
        {selectedThreatId !== null && currentThreat && !isThreatNeutralized && (
          <DroneModal
            drone={currentThreat}
            position={modalPosition}
            droneName={`איום #${currentThreat.id}`}
            hebrewName={getDroneHebrewName(currentThreat.type)}
            flightDistance={calculateFlightDistance(currentThreat)}
            estimatedDamage={getEstimatedDamage(currentThreat.type)}
            onClose={() => setSelectedThreatId(null)}
          />
        )}
        <EventLog />
        <SimulationStats />
        <SimulationControls onRestart={handleRestart} />
      </div>
    </>
  );
};
