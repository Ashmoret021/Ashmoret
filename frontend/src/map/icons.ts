/**
 * map/icons.ts
 *
 * Custom SVG icons for Leaflet simulation entities.
 *
 * Entities:
 *  - Threat Drone (Custom SVG by DroneType)
 *  - Interceptor (🔵 missile with trajectory rotation)
 *  - Defense System / Launcher (Custom SVG by LauncherType)
 *  - Interception / Explosion (✴ burst effect)
 *  - Ground Impact (💥 impact crater & shockwave)
 */

import L from 'leaflet';
import { DroneType, LauncherType } from '../types/types';

export function getDroneIconUrl(type?: string | DroneType): string {
  if (type === undefined || type === null) return '/Falcon-Long-X4.svg';
  const t = String(type).toLowerCase();
  if (t.includes('skymite') || t.includes('c7')) return '/SkyMite-C7.svg';
  if (t.includes('loadbee') || t.includes('m2')) return '/LoadBee-M2.svg';
  if (t.includes('nanoswarm') || t.includes('q9')) return '/NanoSwarm-Q9.svg';
  if (t.includes('falcon') || t.includes('x4')) return '/Falcon-Long-X4.svg';
  return '/Falcon-Long-X4.svg';
}

export function getDefenseIconUrl(type?: string | LauncherType | number): string {
  if (type === undefined || type === null) return '/ShieldNest-Lite.svg';
  const t = String(type).toLowerCase();
  if (t.includes('shieldnest') || t === '0' || t === 'shieldnestlite') return '/ShieldNest-Lite.svg';
  if (t.includes('ironhook') || t === '1' || t === 'ironhooksr') return '/IronHook-SR.svg';
  if (t.includes('horizoneye') || t === '2' || t === 'horizoneyemx') return '/HorizonEye-MX.svg';
  if (t.includes('cloudfence') || t === '3' || t === 'cloudfencearea') return '/CloudFence-Area.svg';
  return '/ShieldNest-Lite.svg';
}

/**
 * Creates an SVG DivIcon for a threat drone using item type icon.
 * Rotates smoothly in the direction of heading (0° = North, 90° = East).
 */
export function createThreatIcon(heading: number = 0, label?: string, type?: string | DroneType): L.DivIcon {
  const rotation = heading;
  const iconUrl = getDroneIconUrl(type);
  return L.divIcon({
    className: 'ashmoret-marker-threat',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${rotation}deg);
        filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.7));
        transition: transform 0.1s linear;
      ">
        <img src="${iconUrl}" width="28" height="28" style="display: block; pointer-events: none;" alt="Threat" />
      </div>
      ${label ? `<div style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 10px; font-weight: 700; color: #fca5a5; background: rgba(15,23,42,0.85); padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(239,68,68,0.4); pointer-events: none;">${label}</div>` : ''}
    `,
  });
}

/**
 * Creates an SVG DivIcon for an in-flight interceptor missile.
 * Rotates towards its heading/bearing.
 */
export function createInterceptorIcon(heading: number = 0): L.DivIcon {
  return L.divIcon({
    className: 'ashmoret-marker-interceptor',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `
      <div style="
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${heading}deg);
        filter: drop-shadow(0 2px 4px rgba(56, 189, 248, 0.8));
      ">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Sleek interceptor missile body -->
          <path d="M12 2L14.5 9V17L17 21L12 19L7 21L9.5 17V9L12 2Z" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/>
          <!-- Propulsion thrust flame -->
          <path d="M11 19.5L12 23L13 19.5Z" fill="#facc15" />
        </svg>
      </div>
    `,
  });
}

/**
 * Creates an SVG DivIcon for a static defense battery / launcher using item type icon.
 */
export function createDefenseIcon(label?: string, type?: string | LauncherType | number): L.DivIcon {
  const iconUrl = getDefenseIconUrl(type);
  return L.divIcon({
    className: 'ashmoret-marker-defense',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div style="
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 4px 6px rgba(59, 130, 246, 0.6));
      ">
        <img src="${iconUrl}" width="32" height="32" style="display: block; pointer-events: none;" alt="Defense Battery" />
      </div>
      ${label ? `<div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 10px; font-weight: 700; color: #93c5fd; background: rgba(15,23,42,0.85); padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(59,130,246,0.4); pointer-events: none;">${label}</div>` : ''}
    `,
  });
}

/**
 * Creates an animated explosion burst icon for successful aerial interceptions.
 */
export function createInterceptionFlashIcon(): L.DivIcon {
  return L.divIcon({
    className: 'ashmoret-marker-flash',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div class="explosion-container">
        <!-- Bright Flashbang Core -->
        <div class="explosion-flash-core"></div>
        <!-- Fireball Smoke & Flame Expansion -->
        <div class="explosion-fireball"></div>
        <!-- High-Speed Shockwave Ring -->
        <div class="explosion-shockwave-fast"></div>
        <!-- Outer Atmospheric Pressure Shockwave -->
        <div class="explosion-shockwave-slow"></div>
        <!-- Flying Debris Sparks SVG -->
        <div class="explosion-sparks">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="25" r="2" fill="#fef08a"/>
            <circle cx="80" cy="30" r="1.5" fill="#f97316"/>
            <circle cx="75" cy="75" r="2.5" fill="#fbbf24"/>
            <circle cx="25" cy="80" r="1.8" fill="#ef4444"/>
            <path d="M50 50 L20 15 M50 50 L85 20 M50 50 L80 80 M50 50 L15 75" stroke="#fde047" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="3 4"/>
          </svg>
        </div>
      </div>
    `,
  });
}

/**
 * Creates a ground impact crater / detonation marker.
 */
export function createImpactIcon(label?: string): L.DivIcon {
  return L.divIcon({
    className: 'ashmoret-marker-impact',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 2px 8px rgba(239, 68, 68, 0.85));
      ">
        <svg viewBox="0 0 60 60" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Expanding Ground Blast Wave -->
          <circle cx="30" cy="30" r="24" stroke="#f97316" stroke-width="2" stroke-dasharray="6 4" fill="rgba(239, 68, 68, 0.25)">
            <animate attributeName="r" values="10;24;20" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="1;0.4;0.8" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <!-- Crater Burst Star -->
          <path d="M30 5 L35 22 L52 22 L38 33 L44 50 L30 40 L16 50 L22 33 L8 22 L25 22 Z" fill="url(#impactGrad)" stroke="#fee2e2" stroke-width="1.5"/>
          <circle cx="30" cy="30" r="5" fill="#ffffff"/>
          <defs>
            <radialGradient id="impactGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="40%" stop-color="#f97316"/>
              <stop offset="100%" stop-color="#991b1b"/>
            </radialGradient>
          </defs>
        </svg>
        ${
          label
            ? `<div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 9px; font-weight: 800; color: #fca5a5; background: rgba(15,23,42,0.92); padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.5); pointer-events: none; letter-spacing: 0.3px;">${label}</div>`
            : ''
        }
      </div>
    `,
  });
}
