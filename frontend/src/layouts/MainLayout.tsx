import React, { useState } from 'react';
import { Header } from '../components/Header/Header';
import { TacticalMap } from '../components/Map/TacticalMap';
import { EventsPanel } from '../components/EventsPanel/EventsPanel';
import { InterceptorsPanel } from '../components/InterceptorsPanel/InterceptorsPanel';
import { SideNavDrawer, NavViewMode } from '../components/Navigation/SideNavDrawer';
import { ScenarioItem } from '../types/simulation';
import { INITIAL_SCENARIOS } from '../mock/events';
import './MainLayout.css';

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

  const handleScenarioSelect = (scenario: ScenarioItem) => {
    setSelectedScenario(scenario);
  };

  const handleCreateScenario = () => {
    console.log('Open Create Scenario modal / action');
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
        <TacticalMap />

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
