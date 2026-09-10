import React from 'react';
import { ChevronLeft, Crosshair, Shield, Info } from 'lucide-react';
import { DroneType, LauncherType, LauncherGroup, DroneGroup } from '../../types/types';
import './LaunchersDronesPanel.css';

type EntityGroup = DroneGroup | LauncherGroup;

interface LaunchersDroneCardProps {
  group: EntityGroup;
  isSelected?: boolean;
  onSelect?: (group: EntityGroup) => void;
}

export const LaunchersDroneCard: React.FC<LaunchersDroneCardProps> = ({
  group,
  isSelected = false,
  onSelect,
}) => {
  const isDroneGroup = (item: EntityGroup): item is DroneGroup => {
    return 'drones' in item;
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
      default:
        return 'badge-type-default';
    }
  };

  const getLauncherTypeClass = (launcherType: LauncherType): string => {
    switch (launcherType) {
      case LauncherType.ShieldNestLite:
        return 'badge-type-a';
      case LauncherType.IronHookSR:
        return 'badge-type-b';
      case LauncherType.HorizonEyeMX:
        return 'badge-type-c';
      case LauncherType.CloudFenceArea:
        return 'badge-type-d';
      default:
        return 'badge-type-default';
    }
  };

  // Perform checks directly on the narrowed union branch
  const isDrone = isDroneGroup(group);

  const uniqueDroneTypes: DroneType[] = isDroneGroup(group)
    ? Array.from(new Set(group.drones.map((d) => d.type)))
    : [];

  const uniqueLauncherTypes: LauncherType[] = !isDroneGroup(group)
    ? Array.from(new Set(group.launchers.map((l) => l.type)))
    : [];

  const totalLaunchers: number = !isDroneGroup(group)
    ? group.launchers.reduce((acc, curr) => acc + (curr.amount ?? 1), 0)
    : 0;

  return (
    <div
      className={`scenario-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect?.(group)}
      role="button"
      tabIndex={0}
    >
      {/* Top Header Row */}
      <div className="card-top-row">
        <div className="scenario-title-wrap">
          {isSelected && <ChevronLeft size={16} className="selected-chevron" />}
          <h4 className="scenario-title">{group.name}</h4>
        </div>

        <span className={`severity-tag ${isDrone ? 'severity-high' : 'severity-low'}`}>
          {isDrone ? 'קבוצת רחפנים' : 'קבוצת משגרים'}
        </span>
      </div>

      {/* Second Row: Unit Count Meta */}
      <div className="card-meta-row">
        <div className="scenario-kind">
          <span className="meta-label">סוג קבוצה:</span>
          <span className="meta-value">{isDrone ? 'תקיפה / סיור' : 'הגנה'}</span>
        </div>

        <div className="drone-count-indicator">
          {isDroneGroup(group) ? (
            <>
              <Crosshair size={13} className="meta-icon" />
              <span>{group.drones.length} רחפנים</span>
            </>
          ) : (
            <>
              <Shield size={13} className="meta-icon" />
              <span>{totalLaunchers} משגרים</span>
            </>
          )}
        </div>
      </div>

      {/* Third Row: Description */}
      {group.description && (
        <div className="card-locations-row">
          <div className="entry-point-label-wrap">
            <Info size={13} className="meta-icon" />
            <span className="meta-label">תיאור:</span>
          </div>

          <div className="group-description-text">{group.description}</div>
        </div>
      )}

      {/* Fourth Row: Equipment Types Badges */}
      <div className="card-drone-types-row">
        <span className="meta-label">
          {isDrone ? 'סוגי רחפנים:' : 'סוגי משגרים:'}
        </span>

        <div className="drone-type-badges">
          {isDrone
            ? uniqueDroneTypes.map((droneType) => (
                <span
                  key={droneType}
                  className={`drone-type-badge ${getDroneTypeClass(droneType)}`}
                >
                  {droneType}
                </span>
              ))
            : uniqueLauncherTypes.map((launcherType) => (
                <span
                  key={launcherType}
                  className={`drone-type-badge ${getLauncherTypeClass(launcherType)}`}
                >
                  {LauncherType[launcherType]}
                </span>
              ))}
        </div>
      </div>
    </div>
  );
};