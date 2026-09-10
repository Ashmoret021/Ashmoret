import React, { useState, useMemo } from 'react';
import { Layers, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { EventScenarioCard } from './EventScenarioCard';
import { EventsFilter, EventTypeFilter, DroneCountFilter } from './EventsFilter';
import { ScenarioItem, ScenarioType } from '../../types/simulation';
import { INITIAL_SCENARIOS } from '../../mock/events';
import './EventsPanel.css';

interface EventsPanelProps {
  scenarios: ScenarioItem[];
  selectedScenarioId?: string;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onOpenStateChange?: (isOpen: boolean) => void;
  onScenarioSelect?: (scenario: ScenarioItem) => void;
  onCreateScenario?: () => void;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({
  scenarios,
  selectedScenarioId = 'sc-2',
  isOpen: controlledIsOpen,
  onToggleOpen,
  onOpenStateChange,
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
      setInternalIsOpen((open) => {
        const nextOpen = !open;
        onOpenStateChange?.(nextOpen);
        return nextOpen;
      });
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
      if (eventTypeFilter === 'single' && sc.type !== ScenarioType.SINGLE_AREA) return false;
      if (eventTypeFilter === 'multi' && sc.type !== ScenarioType.MULTIPLE_AREAS) return false;

      const droneCount = sc.drones?.length ?? 0;
      if (droneCountFilter === '1' && droneCount !== 1) return false;
      if (droneCountFilter === '2-5' && (droneCount < 2 || droneCount > 5)) return false;
      if (droneCountFilter === '6-10' && (droneCount < 6 || droneCount > 10)) return false;
      if (droneCountFilter === '10+' && droneCount < 10) return false;

      return true;
    });
  }, [scenarios, eventTypeFilter, droneCountFilter]);

  return (
    <aside className={`events-panel-wrapper ${isOpen ? 'open' : 'collapsed'}`}>
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

      <div className="events-panel-content">
        {/* Top Header: Action Button and Scenarios Count */}
        <div className="events-top-header">
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
        <EventsFilter
          selectedEventType={eventTypeFilter}
          onEventTypeChange={setEventTypeFilter}
          selectedDroneCount={droneCountFilter}
          onDroneCountChange={setDroneCountFilter}
        />

        {/* Scrollable list of Scenario / Event cards */}
        <div className="scenarios-card-list">
          {filteredScenarios.map((scenario) => (
            <EventScenarioCard
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
