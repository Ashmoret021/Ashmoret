import { Header } from "../components/Header/Header";
import { EventsPanel } from "../components/EventsPanel/EventsPanel";
import { InterceptorsPanel } from "../components/InterceptorsPanel/InterceptorsPanel";
import {
  SideNavDrawer,
  NavViewMode,
} from "../components/Navigation/SideNavDrawer";
import { SimulationSummaryPanel } from "../components/SimulationSummary/SimulationSummaryPanel";
import { LaunchersDronesPanel } from "../components/LaunchersDronesPanel/LaunchersDronesPanel";
import { ScenarioItem } from "../types/simulation";
import { DroneGroup, LauncherGroup, Location } from "../types/types";
import {
  INITIAL_DRONE_GROUPS,
  INITIAL_LAUNCHER_GROUPS,
  INITIAL_SCENARIOS,
} from "../mock/events";
import type { SimulationScenario } from "../simulation/SimulationContext";
import "./MainLayout.css";
import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  getAlertTitleUtilityClass,
} from "@mui/material";
import L, { Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSimulation } from "../simulation/useSimulation";
import { AddScenerioModal } from "../components";
import { MapView } from "../ui/MapView";
import { EventSummary } from "../components/EventSummary/EventSummary";
import {
  clearScenario,
  loadScenario,
  stopClock,
} from "../simulation/SimulationContext";
import { getScenarioById } from "../simulation/sampleScenario";

// ── DB → SimulationScenario adapter ───────────────────────────────────────
// Backend `GET /api/scenarios` returns each scenario with its drones and
// launchers populated via TypeORM relations, but the sim engine expects the
// flat `SimulationScenario` shape (drones/launchers at the top level, plus
// runtime-only `startTime` and `route` fields on each drone). This adapter
// bridges the two so that picking a real scenario actually runs its own
// drones/launchers instead of falling back to a hardcoded sample.
const toNumber = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Project a destination `Location` `distanceM` meters from `start` along
// compass bearing `headingDeg` (0° = North, 90° = East — standard aviation
// convention). Uses the spherical forward geodesic (haversine). We keep the
// altitude fields unchanged so drones fly level from start to endpoint.
const EARTH_RADIUS_M = 6371000;
const DEFAULT_ROUTE_DISTANCE_M = 120_000; // ~120 km — spans Israel end-to-end
const projectDestination = (
  start: Location,
  headingDeg: number,
  distanceM: number,
): Location => {
  const bearing = (headingDeg * Math.PI) / 180;
  const angDist = distanceM / EARTH_RADIUS_M;
  const lat1 = (start.latitude * Math.PI) / 180;
  const lon1 = (start.longitude * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angDist) +
      Math.cos(lat1) * Math.sin(angDist) * Math.cos(bearing),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angDist) * Math.cos(lat1),
      Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2),
    );
  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lon2 * 180) / Math.PI,
    asl: start.asl,
    agl: start.agl,
  };
};

const buildSimulationFromDbScenario = (
  scenario: ScenarioItem,
): SimulationScenario | null => {
  const dbDrones = scenario.dronesGroup?.drones;
  const dbLaunchers = scenario.launchersGroup?.launchers;
  if (!dbDrones || !dbLaunchers) return null;

  const drones = dbDrones.map((d) => {
    const start: Location = {
      longitude: toNumber(d.longitude),
      latitude: toNumber(d.latitude),
      asl: toNumber(d.asl),
      agl: toNumber(d.agl),
    };
    const heading = toNumber(d.heading);
    const velocity = toNumber(d.velocity);
    // DB drones have no waypoint list — synthesize a two-point route by
    // projecting an endpoint along the heading. ThreatEngine needs
    // route.length ≥ 2 to actually advance the drone; otherwise it just
    // parks at route[0]. See ThreatEngine.calculateProgress.
    const end = projectDestination(start, heading, DEFAULT_ROUTE_DISTANCE_M);
    return {
      ...d,
      longitude: start.longitude,
      latitude: start.latitude,
      asl: start.asl,
      agl: start.agl,
      heading,
      velocity,
      startTime: toNumber(d.startTime, 0),
      route: [start, end] as Location[],
    };
  });

  const launchers = dbLaunchers.map((l) => ({
    ...l,
    longitude: toNumber(l.longitude),
    latitude: toNumber(l.latitude),
    asl: toNumber(l.asl),
    agl: toNumber(l.agl),
  }));

  return {
    id: scenario.id,
    name: scenario.name,
    startTime: 0,
    drones,
    launchers,
  };
};

const resolveSimulationScenario = (
  scenario: ScenarioItem,
): SimulationScenario => {
  // Legacy hardcoded samples (sc-*) keep their designed multi-waypoint
  // routes; DB scenarios go through the adapter.
  if (typeof scenario.id === "string" && scenario.id.startsWith("sc-")) {
    return getScenarioById(scenario.id);
  }
  return buildSimulationFromDbScenario(scenario) ?? getScenarioById(scenario.id);
};
import { visualEventQueue } from "../visual/VisualEventQueue";
import { algorithmClient } from "../algorithm/AlgorithmClient";
import {
  useGetAllDronesGroups,
  useGetAllLaunchersGroups,
  useGetAllScenarios,
} from "../api/hooks";

interface MainLayoutProps {
  logoSrc?: string;
  scenarioName?: string;
  defaultScenarioName?: string;
  simId?: string;
  onStartSimulation?: () => void;
  handleMapReady?: (map: Map) => void;
  setShowMainAdditionalComponents: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  onGoToCoordinates?: (lat: number, lng: number) => void;
  onRemoveMarker?: () => void;
  hasMarker?: boolean;
  onAddDroneGroup?: () => void;
  onAddInterceptorGroup?: () => void;
  layersOpen?: boolean;
  onLayersToggle?: () => void;
  layersMenuRef?: React.RefObject<HTMLDivElement>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  logoSrc,
  scenarioName,
  defaultScenarioName = "בחר תרחיש להתחלה",
  simId = "SIM-01",
  onStartSimulation,
  handleMapReady,
  setShowMainAdditionalComponents,
  onGoToCoordinates,
  onRemoveMarker,
  hasMarker = false,
  onAddDroneGroup,
  onAddInterceptorGroup,
  layersOpen = false,
  onLayersToggle,
  layersMenuRef,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<
    DroneGroup | LauncherGroup | null
  >(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [rulerActive, setRulerActive] = useState(false);
  const [navView, setNavView] = useState<NavViewMode>("home");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem | null>(
    null,
  );

  const { dronesGroups, setDronesGroups } = useGetAllDronesGroups();
  const { launchersGroups, setLaunchersGroups } = useGetAllLaunchersGroups();

  //TODO: data doesnt match to INITIAL_SCENARIOS
  const { scenarios, setScenarios } = useGetAllScenarios();

  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [isCreateScenarioOpen, setIsCreateScenarioOpen] = useState(false);
  const { state, pauseClock, resumeClock, setSpeed, startClock } =
    useSimulation();

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

  // ── Scenario selection + full reset ──────────────────────────────────────
  const handleScenarioSelect = (scenario: ScenarioItem) => {
    const renderer = (window as any).__leafletRenderer;

    if (selectedScenario?.id === scenario.id) {
      // Toggle off / deselect scenario
      setSelectedScenario(null);
      stopClock();
      clearScenario();
      visualEventQueue.clear();
      algorithmClient.reset();
      (window as any).__resetSimulationRefs?.();
      if (renderer) {
        renderer.resetVisuals();
      }
    } else {
      setSelectedScenario(scenario);
      stopClock();
      clearScenario();
      visualEventQueue.clear();
      algorithmClient.reset();
      (window as any).__resetSimulationRefs?.();
      if (renderer) {
        renderer.resetVisuals();
      }
      // Load specific scenario into simulation context
      loadScenario(resolveSimulationScenario(scenario));
      if (renderer) {
        renderer.initDefenseSystems();
      }
      startClock();
    }
  };

  const handleScenarioSelectFromSummary = (scenarioId: string) => {
    const foundScenario = scenarios.find((s: ScenarioItem) => s.id === scenarioId);
    if (foundScenario) {
      setSelectedScenario(foundScenario);
    }
    setNavView("scenarios");
  };

  const handleRestart = () => {
    const renderer = (window as any).__leafletRenderer;
    stopClock();
    algorithmClient.reset();
    visualEventQueue.clear();
    (window as any).__resetSimulationRefs?.();
    if (renderer) {
      renderer.resetVisuals();
    }
    if (selectedScenario) {
      loadScenario(resolveSimulationScenario(selectedScenario));
      if (renderer) {
        renderer.initDefenseSystems();
      }
      startClock();
    }
  };

  // ── Panel action stubs ────────────────────────────────────────────────────
  const handleCreateScenario = () => {
    setIsCreateScenarioOpen(true);
  };

  const handleGroupSelect = (group: DroneGroup | LauncherGroup) => {
    setSelectedGroup(group);
  };

  const handleCreateGroup = () => {
    console.log("Open Create Group modal / action");
  };

  const handleViewSimulation = (simulationId: string) => {
    console.log("Viewing simulation:", simulationId);
  };

  const handleViewChange = (view: NavViewMode) => {
    setNavView(view);
    setIsSidebarOpen(true);
  };

  // ── Hide simulation HUD when Summary view is active ───────────────────────
  useEffect(() => {
    if (navView === "summary" || navView === "summary_scenarios") {
      setShowMainAdditionalComponents(false);
    } else {
      setShowMainAdditionalComponents(true);
    }
  }, [navView, setShowMainAdditionalComponents]);

  return (
    <div className="main-layout-container">
      {/* Top Application Header */}
      <Header
        scenarioName={selectedScenario?.name || defaultScenarioName}
        simId={simId}
        isConnected={true}
        isSafeMode={true}
        statusMode={selectedScenario ? "תרחיש פעיל" : "תכנון תרחיש"}
        rulerActive={rulerActive}
        onRulerToggle={() => setRulerActive((active) => !active)}
        layersOpen={layersOpen}
        onLayersToggle={onLayersToggle}
        layersMenuRef={layersMenuRef}
        logoSrc={logoSrc}
        onGoToCoordinates={onGoToCoordinates}
        onRemoveMarker={onRemoveMarker}
        hasMarker={hasMarker}
      />

      {/* Main Workspace */}
      <main className="main-viewport">
        {/* Right-Edge Navigation Drawer */}
        <SideNavDrawer
          activeView={navView}
          onViewChange={handleViewChange}
          sidebarOpen={isSidebarOpen}
        />

        {/* View: Simulation Summary (full-screen, no map / HUD) */}
        {navView === "summary" ? (
          <SimulationSummaryPanel onViewSimulation={handleViewSimulation} />
        ) : navView === "summary_scenarios" ? (
          /* View 2: Scenarios Repository Panel (מאגר תרחישים) */
          <EventSummary
            scenarios={scenarios}
            onSelectScenario={handleScenarioSelectFromSummary}
          />
        ) : (
          <>
            {/* Tactical Map */}
            <div
              style={{ height: "100%", position: "relative", width: "100%" }}
            >
              <MapView onMapReady={handleMapReady} rulerActive={rulerActive} />

              {/* Debug state dialog */}
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
                  <Button onClick={() => setIsStateDialogOpen(false)}>
                    Close
                  </Button>
                </DialogActions>
              </Dialog>
            </div>

            {/* Scenario selection panel (home / drones view) */}
            {navView === "home" && (
              <EventsPanel
                scenarios={scenarios}
                selectedScenarioId={selectedScenario?.id}
                isOpen={isSidebarOpen}
                onToggleOpen={() => setIsSidebarOpen((open) => !open)}
                onScenarioSelect={handleScenarioSelect}
                onCreateScenario={handleCreateScenario}
              />
            )}
            <AddScenerioModal
              open={isCreateScenarioOpen}
              onClose={() => setIsCreateScenarioOpen(false)}
            />

            {/* Events Panel */}
            {navView === "scenarios" && (
              <EventsPanel
                selectedScenarioId={selectedScenario?.id}
                scenarios={scenarios}
                isOpen={isSidebarOpen}
                onToggleOpen={() => setIsSidebarOpen((open) => !open)}
                onScenarioSelect={handleScenarioSelect}
                onCreateScenario={handleCreateScenario}
              />
            )}

            {/* Interceptors / launcher placement panel */}
            {navView === "interceptors" && (
              <LaunchersDronesPanel
                groups={launchersGroups}
                selectedGroupId={selectedGroup?.id}
                isOpen={isSidebarOpen}
                onToggleOpen={() => setIsSidebarOpen((open) => !open)}
                onGroupSelect={handleGroupSelect}
                onCreateGroup={onAddInterceptorGroup ?? handleCreateGroup}
                type="launcher"
              />
            )}
            {navView === "drones" && (
              <LaunchersDronesPanel
                groups={dronesGroups}
                selectedGroupId={selectedGroup?.id}
                isOpen={isSidebarOpen}
                onToggleOpen={() => setIsSidebarOpen((open) => !open)}
                onGroupSelect={handleGroupSelect}
                onCreateGroup={onAddDroneGroup ?? handleCreateGroup}
                type="drone"
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
