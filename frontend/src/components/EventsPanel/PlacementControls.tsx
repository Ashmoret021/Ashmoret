import React from 'react';
import {
  Crosshair,
  Sparkles,
  MousePointer,
  Info,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { PlacementMode } from '../../types/simulation';
import './EventsPanel.css';

interface PlacementControlsProps {
  mode: PlacementMode;
  onModeChange: (mode: PlacementMode) => void;
  onStartSimulation: () => void;
  canStart?: boolean;
}

export const PlacementControls: React.FC<PlacementControlsProps> = ({
  mode,
  onModeChange,
  onStartSimulation,
  canStart = false,
}) => {
  return (
    <div className="placement-controls-container">
      {/* Title */}
      <div className="placement-header">
        <div className="placement-title-wrap">
          <Crosshair size={17} className="placement-title-icon" />
          <h3 className="placement-title">ניהול הצבה</h3>
        </div>
      </div>

      {/* Segmented Mode Toggle */}
      <div className="placement-toggle-group">
        <button
          type="button"
          className={`toggle-btn ${mode === 'auto' ? 'active' : ''}`}
          onClick={() => onModeChange('auto')}
        >
          <Sparkles size={16} />
          <span>הצבה אוטומטית</span>
        </button>

        <button
          type="button"
          className={`toggle-btn ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => onModeChange('manual')}
        >
          <MousePointer size={16} />
          <span>הצבה ידנית</span>
        </button>
      </div>

      {/* Instructional Info Box */}
      <div className="placement-info-box">
        <Info size={16} className="info-icon" />
        <p className="info-text">
          בחר 'הצבה אוטומטית' להמלצת מערכת, או 'הצבה ידנית' להצבה עצמאית
        </p>
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        className="start-sim-button"
        onClick={onStartSimulation}
        disabled={!canStart}
      >
        <Play size={17} className="play-icon" />
        <span>התחל סימולציה</span>
      </button>

      {/* Validation Warning Alert */}
      <div className="placement-warning-note">
        <AlertTriangle size={15} className="warning-icon" />
        <span>יש להציב מיירט אחד לפחות לפני תחילת הסימולציה.</span>
      </div>
    </div>
  );
};
