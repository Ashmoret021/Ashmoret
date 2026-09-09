import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { InterceptorCard } from './InterceptorCard';
import { PlacementControls } from './PlacementControls';
import { InterceptorItem, PlacementMode } from '../../types/simulation';
import { INITIAL_INTERCEPTORS } from '../../mock/interceptors';
import './InterceptorsPanel.css';

interface InterceptorsPanelProps {
  items?: InterceptorItem[];
  scenarioName?: string;
  isSafeMode?: boolean;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onItemSelect?: (item: InterceptorItem) => void;
  onStartSimulation?: () => void;
}

export const InterceptorsPanel: React.FC<InterceptorsPanelProps> = ({
  items = INITIAL_INTERCEPTORS,
  scenarioName = 'רב-זירתי - צפון ומזרח',
  isSafeMode = true,
  isOpen: controlledIsOpen,
  onToggleOpen,
  onItemSelect,
  onStartSimulation,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [selectedId, setSelectedId] = useState<string>('alpha');
  const [placementMode, setPlacementMode] = useState<PlacementMode>('auto');

  const handleToggle = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

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
    <aside className={`interceptors-panel-wrapper ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Edge toggle tab for collapsing/expanding panel */}
      <button
        type="button"
        className="panel-collapse-tab"
        onClick={handleToggle}
        aria-label={isOpen ? 'סגור תפריט' : 'פתח תפריט'}
        title={isOpen ? 'סגור תפריט' : 'פתח תפריט'}
      >
        {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="interceptors-panel-content">
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

        {/* Scrollable list of interceptor cards */}
        <div className="interceptors-card-list">
          {items.map((item) => (
            <InterceptorCard
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onSelect={handleCardSelect}
            />
          ))}
        </div>

        {/* Bottom Placement & Simulation controls */}
        <div className="interceptors-panel-footer">
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
