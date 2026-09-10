import { Header } from "../components/Header/Header";
import { EventsPanel } from "../components/EventsPanel/EventsPanel";
import { InterceptorsPanel } from "../components/InterceptorsPanel/InterceptorsPanel";
import {
  SideNavDrawer,
  NavViewMode,
} from "../components/Navigation/SideNavDrawer";
import { ScenarioItem } from "../types/simulation";
import { INITIAL_SCENARIOS } from "../mock/events";
import "./MainLayout.css";
import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import L, { Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSimulation } from "../simulation/useSimulation";
import { MapView } from "../ui/MapView";
import { EventLog } from "../ui/EventLog";
import { SimulationControls } from "../ui/SimulationControls";
import { SimulationStats } from "../ui/SimulationStats";
import { clearScenario, loadScenario, stopClock } from "../simulation/SimulationContext";
import { sampleScenario, getScenarioById } from "../simulation/sampleScenario";
import { visualEventQueue } from "../visual/VisualEventQueue";
import { algorithmClient } from "../algorithm/AlgorithmClient";

interface MainLayoutProps {
  logoSrc?: string;
  scenarioName?: string;
  defaultScenarioName?: string;
  simId?: string;
  onStartSimulation?: () => void;
  handleMapReady?: (map: Map) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  logoSrc,
  scenarioName,
  defaultScenarioName = "בחר תרחיש להתחלה",
  simId = "SIM-01",
  onStartSimulation,
  handleMapReady,
}) => {
  const [navView, setNavView] = useState<NavViewMode>("drones");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem | null>(null);

  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
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

  const handleCreateScenario = () => {
    console.log("Open Create Scenario modal / action");
  };

  return (
    <div className="main-layout-container">
      {/* Top Application Header */}
      <Header
        scenarioName={selectedScenario?.title || defaultScenarioName}
        simId={simId}
        isConnected={true}
        isSafeMode={true}
        statusMode={selectedScenario ? "תרחיש פעיל" : "תכנון תרחיש"}
        logoSrc={logoSrc}
      />

      {/* Main Workspace: Tactical Map with Right Navigation Drawer & Sidebars */}
      <main className="main-viewport">
        <div style={{ height: "100%", position: "relative", width: "100%" }}>
          <MapView onMapReady={handleMapReady} />
          {selectedScenario && <EventLog />}
          {selectedScenario && <SimulationStats />}
          {selectedScenario && <SimulationControls onRestart={handleRestart} />}
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

        {/* Right-Edge Flyout Navigation Drawer (סיכום סימולציות, פריסת מיירטים, פריסת רחפנים) */}
        <SideNavDrawer activeView={navView} onViewChange={setNavView} />

        {/* Events Panel (פריסת רחפנים / תרחישים) */}
        {navView === "drones" && (
          <EventsPanel
            scenarios={INITIAL_SCENARIOS}
            selectedScenarioId={selectedScenario?.id}
            onScenarioSelect={handleScenarioSelect}
            onCreateScenario={handleCreateScenario}
          />
        )}

        {/* Interceptors Panel (פריסת מיירטים / ניהול הצבה) */}
        {navView === "interceptors" && (
          <InterceptorsPanel
            scenarioName={selectedScenario?.title || defaultScenarioName}
            isSafeMode={true}
            onStartSimulation={onStartSimulation}
          />
        )}

        {/* Simulation Summary Placeholder (סיכום סימולציות) */}
        {navView === "summary" && (
          <InterceptorsPanel
            scenarioName={selectedScenario?.title || defaultScenarioName}
            isSafeMode={true}
            onStartSimulation={onStartSimulation}
          />
        )}
      </main>
    </div>
  );
};
