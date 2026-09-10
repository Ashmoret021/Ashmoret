import React from 'react';
import { ScenarioItem, SeverityLevel } from '../../types/simulation';
import './Event.css';

interface EventProps {
  scenario: ScenarioItem;
  onSelectScenario?: (scenarioId: string) => void;
}

export const Event: React.FC<EventProps> = ({ scenario, onSelectScenario }) => {
  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'low':
        return <span className="severity-badge severity-low">נמוכה</span>;
      case 'high':
      case 'extreme':
        return <span className="severity-badge severity-extreme">קיצונית</span>;
      default:
        return <span className="severity-badge severity-medium">בינונית</span>;
    }
  };

  return (
    <div
      className="scenario-card"
      onClick={() => onSelectScenario && onSelectScenario(scenario.id)}
    >
      {/* Header: Title & Severity */}
      <div className="scenario-card-header">
        <h3 className="scenario-card-title">{scenario.title}</h3>
        {getSeverityBadge(scenario.severity)}
      </div>

      {/* Body: Drone Count, Entry Points, Drone Types */}
      <div className="scenario-card-body">
        <div className="drone-count-text">
          {scenario.droneCount} רחפנים
        </div>

        <div className="scenario-info-row">
          <span className="scenario-info-label">חדירה:</span>
          <div className="scenario-tags-container">
            {scenario.entryPoints.map((point, index) => (
              <span key={index} className="scenario-tag">
                {point}
              </span>
            ))}
          </div>
        </div>

        <div className="scenario-info-row">
          <span className="scenario-info-label">סוגי רחפנים:</span>
          <div className="scenario-tags-container">
            {scenario.droneTypes.map((type, index) => (
              <span key={index} className="scenario-tag-type">
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};