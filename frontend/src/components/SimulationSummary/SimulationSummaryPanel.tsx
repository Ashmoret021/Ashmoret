import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { EventSimulation } from './EventSimulation';
import { EventSimulation as EventSimulationType } from '../../types/simulation';
import { INITIAL_EVENT_SIMULATIONS } from '../../mock/eventSimulations';
import './SimulationSummaryPanel.css';

interface SimulationSummaryPanelProps {
  simulations?: EventSimulationType[];
  onViewSimulation?: (simulationId: string) => void;
}

export const SimulationSummaryPanel: React.FC<SimulationSummaryPanelProps> = ({
  simulations = INITIAL_EVENT_SIMULATIONS,
  onViewSimulation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSimulations = useMemo(() => {
    if (!searchQuery.trim()) return simulations;
    const query = searchQuery.trim().toLowerCase();
    return simulations.filter(
      (sim) =>
        sim.scenario_name.toLowerCase().includes(query) ||
        sim.execution_date.toLowerCase().includes(query) ||
        (sim.scenario_type && sim.scenario_type.toLowerCase().includes(query))
    );
  }, [simulations, searchQuery]);

  return (
    <div className="simulation-summary-panel">
      {/* Top Bar: Search input on the left, Title on the right (RTL) */}
      <div className="summary-header">
        <h1 className="summary-page-title">סיכום סימולציות</h1>

        <div className="summary-search-container">
          <input
            type="text"
            className="summary-search-input"
            placeholder="...חפש"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={18} className="summary-search-icon" />
        </div>
      </div>

      {/* Grid of Simulation Cards */}
      <div className="summary-cards-grid">
        {filteredSimulations.map((sim) => (
          <EventSimulation
            key={sim.id}
            simulation={sim}
            onViewSimulation={onViewSimulation}
          />
        ))}

        {filteredSimulations.length === 0 && (
          <div className="no-summary-results">
            <span>לא נמצאו סימולציות התואמות את החיפוש "{searchQuery}"</span>
          </div>
        )}
      </div>
    </div>
  );
};
