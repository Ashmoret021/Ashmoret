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
import { activateWaitingThreats, advanceThreatPositions } from "./simulation/ThreatEngine";
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
      let updatedThreats = { ...threats };

      // --- Dev 1: Threat activation + movement via ThreatEngine ---
      const prevThreats = updatedThreats;
      updatedThreats = activateWaitingThreats(updatedThreats, simTime);
      for (const [idStr, t] of Object.entries(updatedThreats)) {
        if (t.logicalStatus === 'active' && prevThreats[Number(idStr)]?.logicalStatus === 'waiting') {
          appendLog('detection', 'זיהוי איום', `איום #${idStr} זוהה באוויר`, t.route[0]);
        }
      }
      updatedThreats = advanceThreatPositions(updatedThreats, simTime);
      changed = updatedThreats !== prevThreats;
      // --- End Dev 1 ---

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
        <EventLog />
        <SimulationStats />
        <SimulationControls onRestart={handleRestart} />
      </div>
    </>
  );
};
