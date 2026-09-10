import React from 'react';
import { Filter } from 'lucide-react';
import './LaunchersDronesPanel.css';

export type GroupTypeFilter = 'all' | 'drones' | 'launchers';
export type UnitCountFilter = 'all' | '1' | '2-5' | '6-10' | '10+';

interface LaunchersDronesFilterProps {
  selectedGroupType: GroupTypeFilter;
  onGroupTypeChange: (type: GroupTypeFilter) => void;
  selectedUnitCount: UnitCountFilter;
  onUnitCountChange: (count: UnitCountFilter) => void;
}

export const LaunchersDronesFilter: React.FC<LaunchersDronesFilterProps> = ({
  selectedGroupType,
  onGroupTypeChange,
  selectedUnitCount,
  onUnitCountChange,
}) => {
  return (
    <div className="launchers-drones-filter-container">
      <div className="filter-header">
        <Filter size={14} className="filter-icon" />
        <span className="filter-title">סינון</span>
      </div>

      {/* Row 1: Group Type Filter (Drones / Launchers) */}
      <div className="filter-row">
        <div className="filter-options-group">
          <button
            type="button"
            className={`filter-btn ${selectedGroupType === 'all' ? 'active' : ''}`}
            onClick={() => onGroupTypeChange('all')}
          >
            הכל
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedGroupType === 'drones' ? 'active' : ''}`}
            onClick={() => onGroupTypeChange('drones')}
          >
            רחפנים
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedGroupType === 'launchers' ? 'active' : ''}`}
            onClick={() => onGroupTypeChange('launchers')}
          >
            משגרים
          </button>
        </div>
        <span className="filter-row-label">סוג קבוצה</span>
      </div>

      {/* Row 2: Unit Count Filter */}
      <div className="filter-row">
        <div className="filter-options-group">
          <button
            type="button"
            className={`filter-btn ${selectedUnitCount === 'all' ? 'active' : ''}`}
            onClick={() => onUnitCountChange('all')}
          >
            הכל
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedUnitCount === '1' ? 'active' : ''}`}
            onClick={() => onUnitCountChange('1')}
          >
            1
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedUnitCount === '2-5' ? 'active' : ''}`}
            onClick={() => onUnitCountChange('2-5')}
          >
            5-2
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedUnitCount === '6-10' ? 'active' : ''}`}
            onClick={() => onUnitCountChange('6-10')}
          >
            10-6
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedUnitCount === '10+' ? 'active' : ''}`}
            onClick={() => onUnitCountChange('10+')}
          >
            +10
          </button>
        </div>
        <span className="filter-row-label">כמות יחידות</span>
      </div>
    </div>
  );
};