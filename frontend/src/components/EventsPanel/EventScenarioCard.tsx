import React from 'react';
import { ChevronLeft, Crosshair, MapPin } from 'lucide-react';
import { ScenarioItem, SeverityLevel } from '../../types/simulation';
import { DroneType } from '../../../../types/types';
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

  const getDroneTypeClass = (droneType: DroneType): string => {
    switch (droneType) {
      case DroneType.FalconLongX4:
        return 'badge-type-a';
      case DroneType.LoadBeeM2:
        return 'badge-type-b';
      case DroneType.NanoSwarmQ9:
        return 'badge-type-c';
      case DroneType.SkyMiteC7:
        return 'badge-type-d';
    }
  };

  return (
    <div
      className={`scenario-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect && onSelect(scenario)}
      role="button"
      tabIndex={0}
    >
      {/* Top Header Row: Title on right, Severity Badge on left */}
      <div className="card-top-row">
        <div className="scenario-title-wrap">
          {isSelected && <ChevronLeft size={16} className="selected-chevron" />}
          <h4 className="scenario-title">{scenario.title}</h4>
        </div>

        <span className={`severity-tag severity-${scenario.severity}`}>
          {getSeverityLabel(scenario.severity)}
        </span>
      </div>

      {/* Second Row: Event Type and Drone Count */}
      <div className="card-meta-row">
        <div className="scenario-kind">
          <span className="meta-label">סוג:</span>
          <span className="meta-value">{scenario.type}</span>
        </div>

        <div className="drone-count-indicator">
          <Crosshair size={13} className="meta-icon" />
          <span>{scenario.drones.length} רחפנים</span>
        </div>
      </div>

      {/* Third Row: Entry Points (Locations) */}
      <div className="card-locations-row">
        <div className="entry-point-label-wrap">
          <MapPin size={13} className="meta-icon" />
          <span className="meta-label">חדירה:</span>
        </div>

        <div className="entry-point-tags">
          {scenario.entryPoints.map((point) => (
            <span key={point} className="location-tag">
              {point}
            </span>
          ))}
        </div>
      </div>

      {/* Fourth Row: Drone Types */}
      <div className="card-drone-types-row">
        <span className="meta-label">סוגי רחפנים:</span>

        <div className="drone-type-badges">
          {scenario.drones.map((drone) => (
            <span key={drone.id} className={`drone-type-badge ${getDroneTypeClass(drone.type)}`}>
              {drone.type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
