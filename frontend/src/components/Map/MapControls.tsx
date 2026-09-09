import React from 'react';
import { Plus, Minus, Crosshair } from 'lucide-react';
import './TacticalMap.css';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCenter: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetCenter,
}) => {
  return (
    <div className="tactical-map-controls">
      <button
        type="button"
        className="map-ctrl-btn"
        onClick={onZoomIn}
        title="התקרב"
        aria-label="התקרב"
      >
        <Plus size={16} />
      </button>

      <button
        type="button"
        className="map-ctrl-btn"
        onClick={onZoomOut}
        title="התרחק"
        aria-label="התרחק"
      >
        <Minus size={16} />
      </button>

      <button
        type="button"
        className="map-ctrl-btn"
        onClick={onResetCenter}
        title="מרכז מפה"
        aria-label="מרכז מפה"
      >
        <Crosshair size={16} />
      </button>
    </div>
  );
};
