import React from 'react';
import {
  Settings,
  Bell,
  Radio,
  Wifi,
  ShieldCheck,
  Crosshair,
} from 'lucide-react';
import { CoordinateSearch } from './CoordinateSearch';
import './Header.css';

interface HeaderProps {
  scenarioName?: string;
  simId?: string;
  isConnected?: boolean;
  isSafeMode?: boolean;
  statusMode?: string;
  logoSrc?: string;
  onGoToCoordinates?: (lat: number, lng: number) => void;
  onRemoveMarker?: () => void;
  hasMarker?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  scenarioName = 'רב-זירתי - צפון ומזרח',
  simId = 'SIM-01',
  isConnected = true,
  isSafeMode = true,
  statusMode = 'תכנון תרחיש',
  logoSrc,
  onGoToCoordinates,
  onRemoveMarker,
  hasMarker = false,
}) => {
  return (
    <header className="tactical-header">
      {/* Right section: System branding, logo, and active mode (RTL first) */}
      <div className="header-right">
        <div className="system-branding">
          <div className="brand-logo-container">
            {logoSrc ? (
              <img src={logoSrc} alt="System Logo" className="brand-logo-img" />
            ) : (
              <div className="brand-logo-badge">
                <Crosshair className="brand-crosshair-icon" size={20} />
              </div>
            )}
          </div>
          <div className="brand-titles">
            <h1 className="system-title">מערכת סימולציית יירוט</h1>
            <span className="system-subtitle">SIMULATION CONTROL CENTER</span>
          </div>
        </div>

        <div className="header-mode-indicator">
          <span className="mode-label">מצב:</span>
          <span className="mode-value">
            <span className="mode-dot" />
            {statusMode}
          </span>
        </div>

        {/* Coordinate Search moved to right side */}
        {onGoToCoordinates && (
          <CoordinateSearch
            onGoToCoordinates={onGoToCoordinates}
            onRemoveMarker={onRemoveMarker}
            hasMarker={hasMarker}
          />
        )}
      </div>

      {/* Left section: Controls, scenario tag, and system indicators */}
      <div className="header-left">
        {/* Scenario tag */}
        <div className="scenario-breadcrumb">
          <span className="scenario-label">תרחיש פעיל:</span>
          <span className="scenario-name">{scenarioName}</span>
        </div>

        {/* Safe mode pill */}
        {isSafeMode && (
          <div className="status-pill safe-mode-pill">
            <ShieldCheck size={14} className="safe-icon" />
            <span>מצב בטוח</span>
          </div>
        )}

        {/* Connection status pill */}
        <div className={`status-pill connection-pill ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="pulse-indicator" />
          <span>{isConnected ? 'מערכת מחוברת' : 'מנותק'}</span>
          <Wifi size={14} className="wifi-icon" />
        </div>

        {/* SIM identifier pill */}
        <div className="status-pill sim-id-pill">
          <Radio size={13} className="sim-icon" />
          <span>{simId}</span>
        </div>

        {/* Notification button */}
        <button className="header-action-btn" title="התראות" aria-label="התראות">
          <Bell size={17} />
          <span className="notification-dot" />
        </button>

        {/* Settings button */}
        <button className="header-action-btn" title="הגדרות מערכת" aria-label="הגדרות">
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
};
