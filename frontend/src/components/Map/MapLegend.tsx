import React from 'react';
import './TacticalMap.css';

export const MapLegend: React.FC = () => {
  return (
    <div className="tactical-map-legend">
      <div className="legend-item">
        <span className="legend-dot dot-system-rec" />
        <span className="legend-label">המלצת מערכת</span>
      </div>

      <div className="legend-item">
        <span className="legend-diamond diamond-manual" />
        <span className="legend-label">הצבה ידנית</span>
      </div>

      <div className="legend-item">
        <span className="legend-diamond diamond-drone" />
        <span className="legend-label">רחפן</span>
      </div>

      <div className="legend-item">
        <span className="legend-circle circle-entry" />
        <span className="legend-label">נקודת חדירה</span>
      </div>
    </div>
  );
};
