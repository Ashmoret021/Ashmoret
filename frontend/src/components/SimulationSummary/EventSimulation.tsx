import React from 'react';
import { EventSimulation as EventSimulationType } from '../../types/simulation';
import './EventSimulation.css';

interface EventSimulationProps {
  simulation: EventSimulationType;
  onViewSimulation?: (simulationId: string) => void;
}

export const EventSimulation: React.FC<EventSimulationProps> = ({
  simulation,
  onViewSimulation,
}) => {
  const getScoreClass = (score: number): string => {
    if (score >= 80) return 'score-high'; // Green
    if (score >= 60) return 'score-medium'; // Orange
    return 'score-low'; // Red
  };

  return (
    <div className="event-simulation-card">
      {/* Top Title */}
      <h3 className="event-sim-title">{simulation.scenario_name}</h3>

      {/* Meta Information Lines */}
      <div className="event-sim-details">
        <div className="sim-detail-row">
          <span className="sim-detail-label">כמות רחפנים:</span>
          <span className="sim-detail-value">{simulation.drones_count}</span>
        </div>

        <div className="sim-detail-row">
          <span className="sim-detail-label">תאריך ביצוע:</span>
          <span className="sim-detail-value">{simulation.execution_date}</span>
        </div>

        <div className="sim-detail-row">
          <span className="sim-detail-label">משך הסימולציה:</span>
          <span className="sim-detail-value">{simulation.duration}</span>
        </div>
      </div>

      {/* Card Footer: View Action and Score Badge */}
      <div className="event-sim-footer">
        <button
          type="button"
          className="view-sim-link-btn"
          onClick={() => onViewSimulation && onViewSimulation(simulation.id)}
        >
          צפה בסימולציה
        </button>

        <div className="sim-score-wrapper">
          <span className="sim-score-label">ציון</span>
          <div className={`sim-score-badge ${getScoreClass(simulation.score)}`}>
            {simulation.score}
          </div>
        </div>
      </div>
    </div>
  );
};
