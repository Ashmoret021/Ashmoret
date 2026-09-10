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
import { activateWaitingThreats } from "./simulation/ThreatEngine";
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
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);

  const tickIdRef = useRef<number>(0);
  const lastApiTickSimTimeRef = useRef<number>(-1);
  const pendingApiCallRef = useRef<boolean>(false);
  // Monotonically-increasing counter, incremented every time the simulation
  // is reset. Async algorithm callbacks capture this at call time and skip
  // processing if the generation has changed (stale response guard).
  const simulationGenerationRef = useRef<number>(0);

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
          latitude:  start.latitude  + (end.latitude  - start.latitude)  * progress,
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
      lastApiTickSimTimeRef.current = -1;
      pendingApiCallRef.current = false;
      engagedDronesRef.current.clear();
    };

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
        const citiesLayer = L.geoJSON(response.data);
        layerControl.addOverlay(citiesLayer, "🏙️ ערים");
      })
      .catch((error) => {
        console.error("Failed to load cities layer:", error);
      });
  }, []);

  const handleRestart = useCallback(() => {
    stopClock();
    algorithmClient.reset();
    simulationGenerationRef.current += 1; // invalidate any in-flight async callbacks
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
  // NOTE: App.handleRestart is only used as fallback when no onRestart prop is
  // provided. The actual restart path goes through MainLayout.handleRestart,
  // which uses window.__resetSimulationRefs to reset App-level refs.

  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.stop();
        rendererRef.current = null;
      }
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
      </div>
    </>
  );
};
