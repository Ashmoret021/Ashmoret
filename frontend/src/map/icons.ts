/**
 * map/icons.ts
 *
 * Developer 3 – Mission 3.5
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
      <div style="
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulseFlash 0.8s ease-out forwards;
      ">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Multi-point starburst explosion -->
          <path d="M12 0L14 8L22 4L17 12L24 15L16 17L18 24L12 18L6 24L8 17L0 15L7 12L2 4L10 8L12 0Z" fill="#facc15" stroke="#f59e0b" stroke-width="1" />
          <circle cx="12" cy="12" r="4" fill="#ffffff" />
        </svg>
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
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 2px 6px rgba(249, 115, 22, 0.8));
      ">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Impact blast with concentric crater shockwaves -->
          <circle cx="12" cy="12" r="10" stroke="#f97316" stroke-width="1.5" stroke-dasharray="3 2" fill="rgba(249,115,22,0.2)"/>
          <path d="M12 2L15 9L22 9L17 14L19 21L12 17L5 21L7 14L2 9L9 9L12 2Z" fill="#ea580c" stroke="#fed7aa" stroke-width="1"/>
          <circle cx="12" cy="12" r="3" fill="#ffffff" />
        </svg>
      </div>
      ${label ? `<div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 10px; font-weight: 700; color: #fdba74; background: rgba(15,23,42,0.85); padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(249,115,22,0.4); pointer-events: none;">${label}</div>` : ''}
    `,
  });
}
