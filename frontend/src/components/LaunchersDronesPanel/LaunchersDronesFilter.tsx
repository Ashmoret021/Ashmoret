import React from 'react';
import { Filter } from 'lucide-react';
import './LaunchersDronesPanel.css';

export type EventTypeFilter = 'all' | 'single' | 'multi';
export type DroneCountFilter = 'all' | '1' | '2-5' | '6-10' | '10+';

interface LaunchersDronesFilterProps {
  selectedEventType: EventTypeFilter;
  onEventTypeChange: (type: EventTypeFilter) => void;
  selectedDroneCount: DroneCountFilter;
  onDroneCountChange: (count: DroneCountFilter) => void;
}

export const LaunchersDronesFilter: React.FC<LaunchersDronesFilterProps> = ({
  selectedEventType,
  onEventTypeChange,
  selectedDroneCount,
  onDroneCountChange,
}) => {
  return (
    <div className="launchers-drones-filter-container">
      <div className="filter-header">
        <Filter size={14} className="filter-icon" />
        <span className="filter-title">סינון</span>
      </div>

      {/* Row 1: Event Type Filter */}
      <div className="filter-row">
        <div className="filter-options-group">
          <button
            type="button"
            className={`filter-btn ${selectedEventType === 'all' ? 'active' : ''}`}
            onClick={() => onEventTypeChange('all')}
          >
            הכל
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedEventType === 'single' ? 'active' : ''}`}
            onClick={() => onEventTypeChange('single')}
          >
            חד-זירתי
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedEventType === 'multi' ? 'active' : ''}`}
            onClick={() => onEventTypeChange('multi')}
          >
            רב-זירתי
          </button>
        </div>
        <span className="filter-row-label">סוג אירוע</span>
      </div>

      {/* Row 2: Drone Count Filter */}
      <div className="filter-row">
        <div className="filter-options-group">
          <button
            type="button"
            className={`filter-btn ${selectedDroneCount === 'all' ? 'active' : ''}`}
            onClick={() => onDroneCountChange('all')}
          >
            הכל
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedDroneCount === '1' ? 'active' : ''}`}
            onClick={() => onDroneCountChange('1')}
          >
            1
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedDroneCount === '2-5' ? 'active' : ''}`}
            onClick={() => onDroneCountChange('2-5')}
          >
            5-2
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedDroneCount === '6-10' ? 'active' : ''}`}
            onClick={() => onDroneCountChange('6-10')}
          >
            10-6
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedDroneCount === '10+' ? 'active' : ''}`}
            onClick={() => onDroneCountChange('10+')}
          >
            +10
          </button>
        </div>
        <span className="filter-row-label">כמות רחפנים</span>
      </div>
    </div>
  );
};
