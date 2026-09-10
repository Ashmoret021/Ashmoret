import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Event } from './Event';
import { ScenarioItem } from '../../types/simulation';
import { INITIAL_SCENARIOS } from '../../mock/scenarios';
import './EventSummary.css';

interface EventSummaryProps {
  scenarios?: ScenarioItem[];
  onSelectScenario?: (scenarioId: string) => void;
}

export const EventSummary: React.FC<EventSummaryProps> = ({
  scenarios = INITIAL_SCENARIOS,
  onSelectScenario,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScenarios = useMemo(() => {
    if (!searchQuery.trim()) return scenarios;
    const query = searchQuery.trim().toLowerCase();
    return scenarios.filter((scen) => {
      const title = scen.title ?? "";
      const typeLabel = scen.typeLabel ?? "";
      const entryPoints = scen.entryPoints ?? [];
      const droneTypes = scen.droneTypes ?? [];

      return (
        title.toLowerCase().includes(query) ||
        typeLabel.toLowerCase().includes(query) ||
        entryPoints.some((p) => p.toLowerCase().includes(query)) ||
        droneTypes.some((d) => d.toLowerCase().includes(query))
      );
    });
  }, [scenarios, searchQuery]);

  return (
    <div className="scenarios-repository-panel">
      {/* Top Bar: Title on Right, Search input on Left */}
      <div className="scenarios-header">
        <h1 className="scenarios-page-title">סיכום תרחישים</h1>

        <div className="scenarios-search-container">
          <input
            type="text"
            className="scenarios-search-input"
            placeholder="...חפש"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={18} className="scenarios-search-icon" />
        </div>
      </div>

      {/* Grid of Scenario Cards */}
      <div className="scenarios-cards-grid">
        {filteredScenarios.map((scen) => (
          <Event
            key={scen.id}
            scenario={scen}
            onSelectScenario={onSelectScenario}
          />
        ))}

        {filteredScenarios.length === 0 && (
          <div className="no-scenarios-results">
            <span>לא נמצאו תרחישים התואמים את החיפוש "{searchQuery}"</span>
          </div>
        )}
      </div>
    </div>
  );
};