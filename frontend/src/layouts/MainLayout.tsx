import React from 'react';
import { Header } from '../components/Header/Header';
import { TacticalMap } from '../components/Map/TacticalMap';
import { EventsPanel } from '../components/EventsPanel/EventsPanel';
import './MainLayout.css';

interface MainLayoutProps {
  logoSrc?: string;
  scenarioName?: string;
  simId?: string;
  onStartSimulation?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  logoSrc,
  scenarioName = 'רב-זירתי - צפון ומזרח',
  simId = 'SIM-01',
  onStartSimulation,
}) => {
  return (
    <div className="main-layout-container">
      {/* Top Application Header */}
      <Header
        scenarioName={scenarioName}
        simId={simId}
        isConnected={true}
        isSafeMode={true}
        statusMode="תכנון תרחיש"
        logoSrc={logoSrc}
      />

      {/* Main Workspace: Tactical Map with Overlaid Events Sidebar */}
      <main className="main-viewport">
        <TacticalMap />
        <EventsPanel
          scenarioName={scenarioName}
          isSafeMode={true}
          onStartSimulation={onStartSimulation}
        />
      </main>
    </div>
  );
};
