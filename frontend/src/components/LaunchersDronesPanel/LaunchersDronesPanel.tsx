import React, { useState, useMemo } from 'react';
import { Layers, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { LaunchersDroneCard } from './LaunchersDroneCard';
import { LaunchersDronesFilter, EventTypeFilter, DroneCountFilter } from './LaunchersDronesFilter';
import { ScenarioItem, ScenarioType } from '../../types/simulation';
import { INITIAL_SCENARIOS } from '../../mock/events';
import './LaunchersDronesPanel.css';

interface LaunchersDronesPanelProps {
  scenarios?: ScenarioItem[];
  selectedScenarioId?: string;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onScenarioSelect?: (scenario: ScenarioItem) => void;
  onCreateScenario?: () => void;
}

export const LaunchersDropesPanel: React.FC<LaunchersDronesPanelProps> = ({
  scenarios = INITIAL_SCENARIOS,
  selectedScenarioId = 'sc-2',
  isOpen: controlledIsOpen,
  onToggleOpen,
  onScenarioSelect,
  onCreateScenario,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [activeScenarioId, setActiveScenarioId] = useState<string>(selectedScenarioId);
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('all');
  const [droneCountFilter, setDroneCountFilter] = useState<DroneCountFilter>('all');

  const handleToggle = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const handleSelectScenario = (scenario: ScenarioItem) => {
    setActiveScenarioId(scenario.id);
    if (onScenarioSelect) {
      onScenarioSelect(scenario);
    }
  };

  // Filtered scenarios logic
  const filteredScenarios = useMemo(() => {
    return scenarios.filter((sc) => {
      // Filter by event type
      if (eventTypeFilter === 'single' && sc.type !== ScenarioType.SINGLE_AREA) return false;
      if (eventTypeFilter === 'multi' && sc.type !== ScenarioType.MULTIPLE_AREAS) return false;

      // Filter by drone count
      if (droneCountFilter === '1' && sc.drones.length !== 1) return false;
      if (droneCountFilter === '2-5' && (sc.drones.length < 2 || sc.drones.length > 5)) return false;
      if (droneCountFilter === '6-10' && (sc.drones.length < 6 || sc.drones.length > 10)) return false;
      if (droneCountFilter === '10+' && sc.drones.length < 10) return false;

      return true;
    });
  }, [scenarios, eventTypeFilter, droneCountFilter]);

  return (
    <aside className={`launchers-drones-panel-wrapper ${isOpen ? 'open' : 'collapsed'}`}>
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

      <div className="launchers-drones-panel-content">
        {/* Top Header: Action Button and Scenarios Count */}
        <div className="launchers-drones-top-header">
          <button
            type="button"
            className="create-scenario-btn"
            onClick={onCreateScenario}
          >
            <Plus size={15} />
            <span>צור תרחיש</span>
          </button>

          <div className="scenarios-title-block">
            <h3 className="scenarios-heading">
              תרחישים ({scenarios.length})
            </h3>
            <Layers size={19} className="scenarios-icon" />
          </div>
        </div>

        {/* Filter Section */}
        <LaunchersDronesFilter
          selectedEventType={eventTypeFilter}
          onEventTypeChange={setEventTypeFilter}
          selectedDroneCount={droneCountFilter}
          onDroneCountChange={setDroneCountFilter}
        />

        {/* Scrollable list of Scenario / Event cards */}
        <div className="scenarios-card-list">
          {filteredScenarios.map((scenario) => (
            <LaunchersDroneCard
              key={scenario.id}
              scenario={scenario}
              isSelected={activeScenarioId === scenario.id}
              onSelect={handleSelectScenario}
            />
          ))}

          {filteredScenarios.length === 0 && (
            <div className="no-scenarios-empty">
              <span>לא נמצאו תרחישים התואמים את הסינון</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
