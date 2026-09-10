import { Header } from "../components/Header/Header";
import { EventsPanel } from "../components/EventsPanel/EventsPanel";
import { InterceptorsPanel } from "../components/InterceptorsPanel/InterceptorsPanel";
import { SideNavDrawer, NavViewMode } from "../components/Navigation/SideNavDrawer";
import { SimulationSummaryPanel } from "../components/SimulationSummary/SimulationSummaryPanel";
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

interface MainLayoutProps {
  logoSrc?: string;
  scenarioName?: string;
  defaultScenarioName?: string;
  simId?: string;
  onStartSimulation?: () => void;
  handleMapReady?: (map: Map) => void;
  setShowMainAdditionalComponents: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  logoSrc,
  scenarioName,
  defaultScenarioName = "רב-זירתי - צפון ומזרח",
  simId = "SIM-01",
  onStartSimulation,
  handleMapReady,
  setShowMainAdditionalComponents
}) => {
  const initialScenarioTitle = scenarioName || defaultScenarioName;
  const [navView, setNavView] = useState<NavViewMode>("drones");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem>(
    INITIAL_SCENARIOS[1] || {
      id: "sc-2",
      title: initialScenarioTitle,
      severity: "high",
      type: "multi",
      typeLabel: "רב-זירתי",
      droneCount: 5,
      entryPoints: ["צפון", "מזרח"],
      droneTypes: ["A", "B", "C"],
    },
  );

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
    setSelectedScenario(scenario);
  };

  const handleCreateScenario = () => {
    console.log("Open Create Scenario modal / action");
  };

  const handleViewSimulation = (simulationId: string) => {
    console.log("Viewing simulation:", simulationId);
    setNavView("drones");
  };

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
        scenarioName={selectedScenario.title}
        simId={simId}
        isConnected={true}
        isSafeMode={true}
        statusMode="תכנון תרחיש"
        logoSrc={logoSrc}
      />

      {/* Main Workspace */}
      <main className="main-viewport">
        {/* Navigation Dropdown Drawer (סיכום סימולציות, פריסת מיירטים, פריסת רחפנים וכו') */}
        <SideNavDrawer activeView={navView} onViewChange={setNavView} />


        {/* View 1: Simulation Summary Panel (Without additional sidebar buttons) */}
        {navView === "summary" ? (
          <SimulationSummaryPanel onViewSimulation={handleViewSimulation} />
          
        ) : (
          <>
            {/* Tactical Map View */}
            <div style={{ height: "100vh", position: "relative", width: "100vw" }}>
              <MapView onMapReady={handleMapReady} />
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

        {/* Events Panel (פריסת רחפנים / תרחישים / מסך בית) */}
            {(navView === "drones" || navView === "scenarios") && (
              <EventsPanel
                scenarios={INITIAL_SCENARIOS}
                selectedScenarioId={selectedScenario.id}
                onScenarioSelect={handleScenarioSelect}
                onCreateScenario={handleCreateScenario}
              />
            )}

            {/* Interceptors Panel (פריסת מיירטים / ניהול הצבה) */}
            {navView === "interceptors" && (
              <InterceptorsPanel
                scenarioName={selectedScenario.title}
                isSafeMode={true}
                onStartSimulation={onStartSimulation}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
