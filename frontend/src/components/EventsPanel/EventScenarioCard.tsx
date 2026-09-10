import React from 'react';
import { ChevronLeft, Target, Crosshair, Drone, MapPin } from 'lucide-react';
import { ScenarioItem, SeverityLevel } from '../../types/simulation';
import './EventsPanel.css';
import { DroneType } from '../../types/types';

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
  const getSeverityLabel = (severity: SeverityLevel | undefined): string => {
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

  const getDroneTypeClass = (type: DroneType): string => {
    switch (type) {
      case DroneType.FalconLongX4:
        return 'badge-type-a';
      case DroneType.LoadBeeM2:
        return 'badge-type-b';
      case DroneType.NanoSwarmQ9:
        return 'badge-type-c';
      case DroneType.SkyMiteC7:
        return 'badge-type-d';
      default:
        return 'badge-type-default';
    }
  };

  // Drones live under the populated dronesGroup on the DB-shaped scenario.
  const scenarioDrones = scenario.dronesGroup?.drones ?? [];
  const uniqueDroneTypes = Array.from(new Set(scenarioDrones.map((drone) => drone.type)));
  const entryPoints = scenario.entryPoints ?? [];

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
          <h4 className="scenario-title">{scenario.name}</h4>
        </div>

        <span className={`severity-tag severity-${scenario.severity ?? 'unknown'}`}>
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
          <span>{scenarioDrones.length} רחפנים</span>
        </div>
      </div>

      {/* Third Row: Entry Points (Locations) */}
      <div className="card-locations-row">
        <div className="entry-point-label-wrap">
          <MapPin size={13} className="meta-icon" />
          <span className="meta-label">חדירה:</span>
        </div>

        <div className="entry-point-tags">
          {entryPoints.map((point) => (
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
          {uniqueDroneTypes.map((droneType) => (
            <span key={droneType} className={`drone-type-badge ${getDroneTypeClass(droneType)}`}>
              {DroneType[droneType] ?? droneType}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
