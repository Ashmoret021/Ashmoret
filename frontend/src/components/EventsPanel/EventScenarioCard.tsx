import React from 'react';
import { ChevronLeft, Target, Crosshair } from 'lucide-react';
import { ScenarioItem, SeverityLevel } from '../../types/simulation';
import './EventsPanel.css';

interface EventScenarioCardProps {
  scenario: ScenarioItem;
  isSelected?: boolean;
  onSelect?: (scenario: ScenarioItem) => void;
}

export const EventScenarioCard: React.FC<EventScenarioCardProps> = ({
  scenario,
  isSelected = false,
  onSelect,
}) => {
  const getSeverityLabel = (severity: SeverityLevel): string => {
    switch (severity) {
      case 'low':
        return 'נמוכה';
      case 'high':
        return 'גבוהה';
      case 'extreme':
        return 'קיצונית';
      default:
        return 'רגילה';
    }
  };

  const getDroneTypeClass = (type: string): string => {
    switch (type.toUpperCase()) {
      case 'A':
        return 'badge-type-a';
      case 'B':
        return 'badge-type-b';
      case 'C':
        return 'badge-type-c';
      case 'D':
        return 'badge-type-d';
      default:
        return 'badge-type-default';
    }
  };

  return (
    <div
      className={`scenario-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect && onSelect(scenario)}
      role="button"
      tabIndex={0}
    >
      {/* Top Header Row: Severity Badge and Title */}
      <div className="card-top-row">
        <span className={`severity-tag severity-${scenario.severity}`}>
          {getSeverityLabel(scenario.severity)}
        </span>

        <div className="scenario-title-wrap">
          {isSelected && <ChevronLeft size={16} className="selected-chevron" />}
          <h4 className="scenario-title">{scenario.title}</h4>
        </div>
      </div>

      {/* Second Row: Event Type and Drone Count */}
      <div className="card-meta-row">
        <div className="drone-count-indicator">
          <Target size={14} className="meta-icon" />
          <span>{scenario.droneCount} רחפנים</span>
        </div>

        <div className="scenario-kind">
          <span className="meta-label">סוג:</span>
          <span className="meta-value">{scenario.typeLabel}</span>
        </div>
      </div>

      {/* Third Row: Entry Points (Locations) */}
      <div className="card-locations-row">
        <div className="entry-point-tags">
          {scenario.entryPoints.map((point) => (
            <span key={point} className="location-tag">
              {point}
            </span>
          ))}
        </div>

        <div className="entry-point-label-wrap">
          <Crosshair size={13} className="meta-icon" />
          <span className="meta-label">חדירה:</span>
        </div>
      </div>

      {/* Fourth Row: Drone Types */}
      <div className="card-drone-types-row">
        <div className="drone-type-badges">
          {scenario.droneTypes.map((type) => (
            <span key={type} className={`drone-type-badge ${getDroneTypeClass(type)}`}>
              {type}
            </span>
          ))}
        </div>

        <span className="meta-label">סוגי רחפנים:</span>
      </div>
    </div>
  );
};
