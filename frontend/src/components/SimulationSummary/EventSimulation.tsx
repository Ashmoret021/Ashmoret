import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import {
  CalendarDays,
  Clock3,
  FileText,
  Maximize,
  Play,
  Trophy,
  X,
} from 'lucide-react';
import { EventSimulation as EventSimulationType } from '../../types/simulation';
import { MapView } from '../../ui/MapView';
import { createDefenseIcon, createThreatIcon } from '../../map/icons';
import './EventSimulation.css';

interface EventSimulationProps {
  simulation: EventSimulationType;
  onViewSimulation?: (simulationId: string) => void;
}

export const EventSimulation: React.FC<EventSimulationProps> = ({
  simulation,
  onViewSimulation,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createThreatTypeIcon = (
    type: 'missile' | 'aircraft',
    label: string,
  ): L.DivIcon => {
    const glyph = type === 'missile' ? '➤' : '✈';
    const color = type === 'missile' ? '#f97316' : '#ef4444';

    return L.divIcon({
      className: 'simulation-threat-type-icon',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      html: `
        <div class="simulation-threat-symbol" style="--threat-color: ${color};">
          <span>${glyph}</span>
          <b>${label}</b>
        </div>
      `,
    });
  };

  const addSimulationUnits = (map: L.Map) => {
    const dronePositions: L.LatLngExpression[] = [
      [31.22, 34.74],
      [31.42, 34.91],
      [31.06, 35.18],
      [31.64, 34.82],
      [30.82, 34.99],
    ];
    const missilePositions: L.LatLngExpression[] = [
      [30.72, 34.62],
      [31.76, 35.18],
    ];
    const aircraftPositions: L.LatLngExpression[] = [
      [32.02, 34.82],
      [31.78, 34.48],
    ];
    const launcherPositions: L.LatLngExpression[] = [
      [31.32, 34.78],
      [31.12, 35.02],
      [31.58, 34.98],
    ];
    const units = L.layerGroup().addTo(map);

    dronePositions.slice(0, Math.max(1, Math.min(simulation.drones_count, dronePositions.length))).forEach(
      (position, index) => {
        L.marker(position, {
          icon: createThreatIcon(25 + index * 18, `רחפן ${index + 1}`),
        })
          .bindTooltip(`רחפן ${index + 1}`, { direction: 'top', offset: [0, -12] })
          .addTo(units);
      },
    );

    missilePositions.forEach((position, index) => {
      L.marker(position, {
        icon: createThreatTypeIcon('missile', `טיל ${index + 1}`),
      })
        .bindTooltip(`איום טילי ${index + 1}`, {
          direction: 'top',
          offset: [0, -15],
        })
        .addTo(units);
    });

    aircraftPositions.forEach((position, index) => {
      L.marker(position, {
        icon: createThreatTypeIcon('aircraft', `מטוס ${index + 1}`),
      })
        .bindTooltip(`כלי טיס עוין ${index + 1}`, {
          direction: 'top',
          offset: [0, -15],
        })
        .addTo(units);
    });

    launcherPositions.forEach((position, index) => {
      L.marker(position, {
        icon: createDefenseIcon(`מיירט ${index + 1}`),
      })
        .bindTooltip(`משגר ${index + 1}`, { direction: 'bottom', offset: [0, 12] })
        .addTo(units);
      L.circle(position, {
        radius: 18000,
        color: '#3b82f6',
        weight: 1,
        opacity: 0.5,
        fillColor: '#2563eb',
        fillOpacity: 0.06,
        interactive: false,
      }).addTo(units);
    });
  };

  useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsModalOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.body.classList.add('simulation-viewer-open');
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('simulation-viewer-open');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const getScoreClass = (score: number): string => {
    if (score >= 80) return 'score-high'; // Green
    if (score >= 60) return 'score-medium'; // Orange
    return 'score-low'; // Red
  };

  return (
    <div className={`event-simulation-card${isModalOpen ? ' is-viewing' : ''}`}>
      {/* Top Title */}
      <h3 className="event-sim-title">{simulation.scenario_name}</h3>

      {/* Meta Information Lines */}
      <div className="event-sim-details">
        <div className="sim-detail-row">
          <span className="sim-detail-label">כמות רחפנים:</span>
          <span className="sim-detail-value">{simulation.drones_count}</span>
        </div>

        <div className="sim-detail-row">
          <span className="sim-detail-label">תאריך ביצוע:</span>
          <span className="sim-detail-value">{simulation.execution_date}</span>
        </div>

        <div className="sim-detail-row">
          <span className="sim-detail-label">משך הסימולציה:</span>
          <span className="sim-detail-value">{simulation.duration}</span>
        </div>
      </div>

      {/* Card Footer: View Action and Score Badge */}
      <div className="event-sim-footer">
        <button
          type="button"
          className="view-sim-link-btn"
          onClick={() => {
            setIsModalOpen(true);
            onViewSimulation?.(simulation.id);
          }}
        >
          צפה בסימולציה
        </button>

        <div className="sim-score-wrapper">
          <span className="sim-score-label">ציון</span>
          <div className={`sim-score-badge ${getScoreClass(simulation.score)}`}>
            {simulation.score}
          </div>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div
          className="simulation-viewer-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsModalOpen(false);
          }}
        >
          <section
            className="simulation-viewer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`simulation-viewer-title-${simulation.id}`}
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="simulation-viewer-close"
              aria-label="סגור"
              onClick={() => setIsModalOpen(false)}
            >
              <X size={23} />
            </button>

            <header className="simulation-viewer-header">
              <div>
                <h2 id={`simulation-viewer-title-${simulation.id}`}>
                  צפייה בסימולציה
                </h2>
                <p>{simulation.scenario_name} | {simulation.drones_count} רחפנים</p>
              </div>
              <span className="simulation-viewer-play-icon">
                <Play size={20} fill="currentColor" />
              </span>
            </header>

            <div className="simulation-viewer-body">
              <div className="simulation-preview">
                <div className="simulation-map-container" aria-label="מפת הסימולציה">
                  <MapView
                    center={[31.0461, 34.8516]}
                    zoom={7}
                    onMapReady={addSimulationUnits}
                  />
                </div>
                <div className="simulation-player-controls">
                  <span>▶ 00:00/{simulation.duration}</span>
                  <span className="simulation-progress"><i /></span>
                  <strong>1x</strong>
                  <Maximize size={17} />
                </div>
              </div>

              <aside className="simulation-viewer-details">
                <h3><FileText size={16} /> פרטי סימולציה</h3>
                <div className="simulation-detail-item">
                  <span>תאריך ביצוע <CalendarDays size={17} /></span>
                  <strong>{simulation.execution_date}</strong>
                </div>
                <div className="simulation-detail-item">
                  <span>משך הסימולציה <Clock3 size={17} /></span>
                  <strong>{simulation.duration}</strong>
                </div>
                <div className="simulation-detail-item">
                  <span>תרחיש <FileText size={17} /></span>
                  <strong>{simulation.scenario_type || 'לא צוין'}</strong>
                </div>
                <div className="simulation-detail-score">
                  <span>ציון <Trophy size={17} /></span>
                  <div className={`sim-score-badge ${getScoreClass(simulation.score)}`}>
                    {simulation.score}
                  </div>
                </div>
                <div className="simulation-description">
                  <h3>תיאור כללי</h3>
                  <p>במהלך הסימולציה הופעלו {simulation.drones_count} רחפנים בהתאם לתרחיש שנבחר.</p>
                </div>
                <button
                  type="button"
                  className="simulation-replay-button"
                  onClick={() => setIsModalOpen(false)}
                >
                  <Play size={15} fill="currentColor" aria-hidden="true" />
                  <span>צפה שוב</span>
                </button>
              </aside>
            </div>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
};
