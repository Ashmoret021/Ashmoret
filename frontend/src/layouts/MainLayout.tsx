import { Header } from '../components/Header/Header';
import { EventsPanel } from '../components/EventsPanel/EventsPanel';
import { InterceptorsPanel } from '../components/InterceptorsPanel/InterceptorsPanel';
import { SideNavDrawer, NavViewMode } from '../components/Navigation/SideNavDrawer';
import { ScenarioItem } from '../types/simulation';
import { INITIAL_SCENARIOS } from '../mock/events';
import './MainLayout.css';
import React , { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSimulation } from "../simulation/useSimulation";
import { AddScenerioModal } from '../components';

interface MainLayoutProps {
  logoSrc?: string;
  scenarioName?: string;
  defaultScenarioName?: string;
  simId?: string;
  onStartSimulation?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  logoSrc,
  scenarioName,
  defaultScenarioName = 'רב-זירתי - צפון ומזרח',
  simId = 'SIM-01',
  onStartSimulation,
}) => {
  const initialScenarioTitle = scenarioName || defaultScenarioName;
  const [navView, setNavView] = useState<NavViewMode>('drones');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem>(
    INITIAL_SCENARIOS[1] || {
      id: 'sc-2',
      title: initialScenarioTitle,
      severity: 'high',
      type: 'multi',
      typeLabel: 'רב-זירתי',
      droneCount: 5,
      entryPoints: ['צפון', 'מזרח'],
      droneTypes: ['A', 'B', 'C'],
    }
  );

  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [isCreateScenarioOpen, setIsCreateScenarioOpen] = useState(false);
  const { state, pauseClock, resumeClock, setSpeed, startClock } =
    useSimulation();

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = L.map(mapRef.current).setView([31.0461, 34.8516], 6);

    const streetLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      },
    );

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
      },
    );

    streetLayer.addTo(map);

    const baseMaps = {
      "🗺️ מפה רגילה": streetLayer,
      "🛰️ צילום לווייני": satelliteLayer,
    };

    L.control.layers(baseMaps).addTo(map);

    fetch("/CITIES.geojson")
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data).addTo(map);
      });

    return () => {
      map.remove();
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

  const handleScenarioSelect = (scenario: ScenarioItem) => {
    setSelectedScenario(scenario);
  };

  const handleCreateScenario = () => {
    setIsCreateScenarioOpen(true);
  };

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

      {/* Main Workspace: Tactical Map with Right Navigation Drawer & Sidebars */}
      <main className="main-viewport">
        <div style={{ height: "100vh", position: "relative", width: "100vw" }}>
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

        {/* Right-Edge Flyout Navigation Drawer (סיכום סימולציות, פריסת מיירטים, פריסת רחפנים) */}
        <SideNavDrawer
          activeView={navView}
          onViewChange={setNavView}
        />

        {/* Events Panel (פריסת רחפנים / תרחישים) */}
        {navView === 'drones' && (
          <EventsPanel
            scenarios={INITIAL_SCENARIOS}
            selectedScenarioId={selectedScenario.id}
            onScenarioSelect={handleScenarioSelect}
            onCreateScenario={handleCreateScenario}
          />
        )}

        <AddScenerioModal open={isCreateScenarioOpen} onClose={() => setIsCreateScenarioOpen(false)}/>

        {/* Interceptors Panel (פריסת מיירטים / ניהול הצבה) */}
        {navView === 'interceptors' && (
          <InterceptorsPanel
            scenarioName={selectedScenario.title}
            isSafeMode={true}
            onStartSimulation={onStartSimulation}
          />
        )}

        {/* Simulation Summary Placeholder (סיכום סימולציות) */}
        {navView === 'summary' && (
          <InterceptorsPanel
            scenarioName={selectedScenario.title}
            isSafeMode={true}
            onStartSimulation={onStartSimulation}
          />
        )}
      </main>
    </div>
  );
};
