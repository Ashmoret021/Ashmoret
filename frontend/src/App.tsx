import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapView } from "./ui/MapView";
import { SimulationControls } from "./ui/SimulationControls";
import { SimulationStats } from "./ui/SimulationStats";
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
import { Drone, DroneType } from "./types/types";
import DroneModal from "./components/DroneModal/DroneModal";
import axios from "axios";
import { MainLayout } from "./layouts/MainLayout";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import "leaflet/dist/leaflet.css";
import { useSimulation } from "./simulation/useSimulation";

export const App = () => {
  const rendererRef = useRef<LeafletRenderer | null>(null);
  const engagedDronesRef = useRef<Set<number>>(new Set());
  const [layers, setLayers] = useState<string[]>(["🗺️ מפה רגילה"]);
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const { state, pauseClock, resumeClock, setSpeed, startClock } =
    useSimulation();

  useEffect(() => {
    // Load default realistic scenario once on mount
    loadScenario(sampleScenario);
    engagedDronesRef.current.clear();

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
          const flightDuration = 35; // 35 seconds across corridor
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
      .layers(baseMaps, undefined, { position: "topleft" })
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
      <MainLayout
        scenarioName="רב-זירתי - צפון ומזרח"
        simId="SIM-01"
        onStartSimulation={handleStartSimulation}
      />
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
        <MapView onMapReady={handleMapReady} />
        <EventLog />
        <SimulationStats />
        <SimulationControls onRestart={handleRestart} />

        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
        <Button
          onClick={() => setIsStateDialogOpen(true)}
          style={{ left: 16, position: "absolute", top: 16, zIndex: 1000 }}
          variant="contained"
        >
          View simulation state
        </Button>

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
};
