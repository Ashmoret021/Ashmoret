import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { EventCard } from './EventCard';
import { PlacementControls } from './PlacementControls';
import { InterceptorItem, PlacementMode } from '../../types/simulation';
import { INITIAL_INTERCEPTORS } from '../../mock/interceptors';
import './EventsPanel.css';

interface EventsPanelProps {
  items?: InterceptorItem[];
  scenarioName?: string;
  isSafeMode?: boolean;
  onItemSelect?: (item: InterceptorItem) => void;
  onStartSimulation?: () => void;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({
  items = INITIAL_INTERCEPTORS,
  scenarioName = 'רב-זירתי - צפון ומזרח',
  isSafeMode = true,
  onItemSelect,
  onStartSimulation,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('alpha');
  const [placementMode, setPlacementMode] = useState<PlacementMode>('auto');

  const handleCardSelect = (id: string) => {
    setSelectedId(id);
    const item = items.find((i) => i.id === id);
    if (item && onItemSelect) {
      onItemSelect(item);
    }
  };

  const handleStartSim = () => {
    if (onStartSimulation) {
      onStartSimulation();
    } else {
      console.log('Starting simulation with mode:', placementMode);
    }
  };

  return (
    <aside className={`events-panel-wrapper ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Edge toggle tab for collapsing/expanding panel */}
      <button
        type="button"
        className="panel-collapse-tab"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'סגור תפריט' : 'פתח תפריט'}
        title={isOpen ? 'סגור תפריט' : 'פתח תפריט'}
      >
        {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="events-panel-content">
        {/* Panel top scenario header */}
        <div className="panel-header-banner">
          <div className="panel-scenario-title">
            <span className="banner-scenario-label">תרחיש פעיל:</span>
            <span className="banner-scenario-val">{scenarioName}</span>
          </div>

          {isSafeMode && (
            <div className="panel-safe-badge">
              <ShieldCheck size={14} />
              <span>מצב בטוח</span>
            </div>
          )}
        </div>

        {/* Scrollable list of interceptor / event cards */}
        <div className="events-card-list">
          {items.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onSelect={handleCardSelect}
            />
          ))}
        </div>

        {/* Bottom Placement & Simulation controls */}
        <div className="events-panel-footer">
          <PlacementControls
            mode={placementMode}
            onModeChange={setPlacementMode}
            onStartSimulation={handleStartSim}
            canStart={false}
          />
        </div>
      </div>
    </aside>
  );
};
