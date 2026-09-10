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
import { DroneGroup, LauncherGroup } from "../types/types";
import {
  INITIAL_DRONE_GROUPS,
  INITIAL_LAUNCHER_GROUPS,
  INITIAL_SCENARIOS,
} from "../mock/events";
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
import {
  clearScenario,
  loadScenario,
  stopClock,
} from "../simulation/SimulationContext";
import { getScenarioById } from "../simulation/sampleScenario";
import { visualEventQueue } from "../visual/VisualEventQueue";
import { algorithmClient } from "../algorithm/AlgorithmClient";
import { useGetAllDronesGroups, useGetAllLaunchersGroups, useGetAllScenarios } from "../api/hooks";

interface MainLayoutProps {
  logoSrc?: string;
  scenarioName?: string;
  defaultScenarioName?: string;
  simId?: string;
  onStartSimulation?: () => void;
  handleMapReady?: (map: Map) => void;
  setShowMainAdditionalComponents: React.Dispatch<React.SetStateAction<boolean>>;
  onGoToCoordinates?: (lat: number, lng: number) => void;
  onRemoveMarker?: () => void;
  hasMarker?: boolean;
  onAddDroneGroup?: () => void;
  onAddInterceptorGroup?: () => void;
  layersOpen?: boolean;
  onLayersToggle?: () => void;
  layersMenuRef?: React.RefObject<HTMLDivElement | null>;
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
  const [rulerActive, setRulerActive] = useState(false);
  const [navView, setNavView] = useState<NavViewMode>("home");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem | null>(null);

  const {dronesGroups, setDronesGroups} = useGetAllDronesGroups();
  const {launchersGroups, setLaunchersGroups} = useGetAllLaunchersGroups();


  //TODO: data doesnt match to INITIAL_SCENARIOS
  const {scenarios, setScenarios} = useGetAllScenarios();

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
      loadScenario(getScenarioById(scenario.id));
      if (renderer) {
        renderer.initDefenseSystems();
      }
    }
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
      loadScenario(getScenarioById(selectedScenario.id));
      if (renderer) {
        renderer.initDefenseSystems();
      }
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
    setNavView("drones");
  };

  // ── Hide simulation HUD when Summary view is active ───────────────────────
  useEffect(() => {
    if (navView === "summary") {
      setShowMainAdditionalComponents(false);
    } else {
      setShowMainAdditionalComponents(true);
    }
  }, [navView]);

  return (
    <div className="main-layout-container">
      {/* Top Application Header */}
      <Header
        scenarioName={selectedScenario?.title || defaultScenarioName}
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
        <SideNavDrawer activeView={navView} onViewChange={setNavView} />

        {/* View: Simulation Summary (full-screen, no map / HUD) */}
        {navView === "summary" ? (
          <SimulationSummaryPanel onViewSimulation={handleViewSimulation} />
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
            {(navView === "home") && (
              <EventsPanel
                scenarios={INITIAL_SCENARIOS}
                selectedScenarioId={selectedScenario?.id}
                onScenarioSelect={handleScenarioSelect}
                onCreateScenario={handleCreateScenario}
              />
            )}
            <AddScenerioModal
              open={isCreateScenarioOpen}
              onClose={() => setIsCreateScenarioOpen(false)}
            />

            {/* Scenarios panel (dedicated scenarios view) */}
            {navView === "scenarios" && (
              <EventsPanel
                selectedScenarioId={selectedScenario?.id}
                scenarios={INITIAL_SCENARIOS}
                onScenarioSelect={handleScenarioSelect}
                onCreateScenario={handleCreateScenario}
              />
            )}

            {/* Interceptors / launcher placement panel */}
            {navView === "interceptors" && (
              <LaunchersDronesPanel
                groups={launchersGroups}
                selectedGroupId={selectedGroup?.id}
                onGroupSelect={handleGroupSelect}
                onCreateGroup={onAddInterceptorGroup ?? handleCreateGroup}
              />
            )}
            {navView === "drones" && (
              <LaunchersDronesPanel
                groups={dronesGroups}
                selectedGroupId={selectedGroup?.id}
                onGroupSelect={handleGroupSelect}
                onCreateGroup={onAddDroneGroup ?? handleCreateGroup}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
