import {
  DroneType,
  InterceptorType,
  LauncherType,
} from '../../../types/types';
import type { Scenario } from './SimulationContext';

/**
 * Advanced multi-wave scenario with 14 threats arriving from 6 directions.
 * Wave 1 (t=2–6):  Northern corridor (Lebanon border area)
 * Wave 2 (t=8–14): North-east corridor (Syrian/Golan)
 * Wave 3 (t=10–16): Eastern corridor (Jordan border)
 * Wave 4 (t=18–24): South-eastern (Negev/Sinai border)
 * Wave 5 (t=20–26): Southern (Red Sea / Eilat direction)
 * Wave 6 (t=12–18): Western / Sea approach (Mediterranean)
 */
export const sampleScenario: Scenario = {
  id: 'scenario-advanced-01',
  name: 'תרחיש איום מתקדם – גלים מרובים',
  startTime: 0,

  launchers: [
    // ── Northern battery (Haifa / Carmel area) ──
    {
      id: 101,
      type: LauncherType.IronHookSR,
      active: true,
      amount: 30,
      location: { latitude: 32.794, longitude: 34.989, asl: 200, agl: 0 },
      ammunition: [
        [InterceptorType.BuzzStop15, 15],
        [InterceptorType.DartFoxS, 15],
      ],
    },
    // ── Central battery (Tel Aviv metro) ──
    {
      id: 102,
      type: LauncherType.ShieldNestLite,
      active: true,
      amount: 20,
      location: { latitude: 32.0853, longitude: 34.7818, asl: 30, agl: 0 },
      ammunition: [
        [InterceptorType.SkyLanceM, 10],
        [InterceptorType.NetWing30, 10],
      ],
    },
    // ── Jerusalem battery ──
    {
      id: 103,
      type: LauncherType.HorizonEyeMX,
      active: true,
      amount: 25,
      location: { latitude: 31.7683, longitude: 35.2137, asl: 750, agl: 0 },
      ammunition: [
        [InterceptorType.SkyLanceM, 12],
        [InterceptorType.FalconClipH, 13],
      ],
    },
    // ── Southern battery (Be'er Sheva) ──
    {
      id: 104,
      type: LauncherType.CloudFenceArea,
      active: true,
      amount: 20,
      location: { latitude: 31.2516, longitude: 34.7913, asl: 280, agl: 0 },
      ammunition: [
        [InterceptorType.SwarmMist5, 10],
        [InterceptorType.MicroNetR, 10],
      ],
    },
    // ── Coastal battery (Ashdod area) ──
    {
      id: 105,
      type: LauncherType.IronHookSR,
      active: true,
      amount: 18,
      location: { latitude: 31.8043, longitude: 34.6553, asl: 10, agl: 0 },
      ammunition: [
        [InterceptorType.BuzzStop15, 10],
        [InterceptorType.SpearMini70, 8],
      ],
    },
  ],

  drones: [
    // ══ Wave 1: Northern corridor (Lebanon border → central Israel) ══
    {
      id: 1,
      type: DroneType.SkyMiteC7,
      heading: 195,
      velocity: 120,
      startTime: 2,
      location: { latitude: 33.05, longitude: 35.10, asl: 450, agl: 450 },
      route: [
        { latitude: 33.05, longitude: 35.10, asl: 450, agl: 450 },
        { latitude: 32.09, longitude: 34.78, asl: 300, agl: 300 },
      ],
    },
    {
      id: 2,
      type: DroneType.FalconLongX4,
      heading: 200,
      velocity: 160,
      startTime: 4,
      location: { latitude: 33.20, longitude: 35.35, asl: 700, agl: 700 },
      route: [
        { latitude: 33.20, longitude: 35.35, asl: 700, agl: 700 },
        { latitude: 32.79, longitude: 34.99, asl: 500, agl: 500 },
      ],
    },
    {
      id: 3,
      type: DroneType.NanoSwarmQ9,
      heading: 210,
      velocity: 90,
      startTime: 6,
      location: { latitude: 33.10, longitude: 35.55, asl: 350, agl: 350 },
      route: [
        { latitude: 33.10, longitude: 35.55, asl: 350, agl: 350 },
        { latitude: 32.30, longitude: 35.22, asl: 200, agl: 200 },
      ],
    },

    // ══ Wave 2: North-east corridor (Syria/Golan → Jordan Valley) ══
    {
      id: 4,
      type: DroneType.FalconLongX4,
      heading: 240,
      velocity: 145,
      startTime: 8,
      location: { latitude: 33.40, longitude: 36.60, asl: 900, agl: 900 },
      route: [
        { latitude: 33.40, longitude: 36.60, asl: 900, agl: 900 },
        { latitude: 32.08, longitude: 34.78, asl: 600, agl: 600 },
      ],
    },
    {
      id: 5,
      type: DroneType.SkyMiteC7,
      heading: 230,
      velocity: 110,
      startTime: 10,
      location: { latitude: 33.00, longitude: 36.20, asl: 600, agl: 600 },
      route: [
        { latitude: 33.00, longitude: 36.20, asl: 600, agl: 600 },
        { latitude: 31.77, longitude: 35.21, asl: 400, agl: 400 },
      ],
    },

    // ══ Wave 3: Eastern corridor (Jordan border → Jerusalem / Dead Sea) ══
    {
      id: 6,
      type: DroneType.LoadBeeM2,
      heading: 260,
      velocity: 100,
      startTime: 10,
      location: { latitude: 32.20, longitude: 36.80, asl: 500, agl: 500 },
      route: [
        { latitude: 32.20, longitude: 36.80, asl: 500, agl: 500 },
        { latitude: 31.77, longitude: 35.21, asl: 380, agl: 380 },
      ],
    },
    {
      id: 7,
      type: DroneType.NanoSwarmQ9,
      heading: 255,
      velocity: 85,
      startTime: 13,
      location: { latitude: 31.95, longitude: 36.50, asl: 400, agl: 400 },
      route: [
        { latitude: 31.95, longitude: 36.50, asl: 400, agl: 400 },
        { latitude: 31.77, longitude: 35.21, asl: 350, agl: 350 },
      ],
    },
    {
      id: 8,
      type: DroneType.FalconLongX4,
      heading: 265,
      velocity: 150,
      startTime: 16,
      location: { latitude: 31.50, longitude: 36.40, asl: 650, agl: 650 },
      route: [
        { latitude: 31.50, longitude: 36.40, asl: 650, agl: 650 },
        { latitude: 31.25, longitude: 34.79, asl: 450, agl: 450 },
      ],
    },

    // ══ Wave 4: South-eastern (Sinai / Negev approach) ══
    {
      id: 9,
      type: DroneType.SkyMiteC7,
      heading: 300,
      velocity: 130,
      startTime: 18,
      location: { latitude: 30.20, longitude: 34.90, asl: 400, agl: 400 },
      route: [
        { latitude: 30.20, longitude: 34.90, asl: 400, agl: 400 },
        { latitude: 31.25, longitude: 34.79, asl: 280, agl: 280 },
      ],
    },
    {
      id: 10,
      type: DroneType.LoadBeeM2,
      heading: 315,
      velocity: 105,
      startTime: 20,
      location: { latitude: 30.00, longitude: 35.20, asl: 350, agl: 350 },
      route: [
        { latitude: 30.00, longitude: 35.20, asl: 350, agl: 350 },
        { latitude: 31.77, longitude: 35.21, asl: 300, agl: 300 },
      ],
    },

    // ══ Wave 5: Southern / Eilat direction ══
    {
      id: 11,
      type: DroneType.NanoSwarmQ9,
      heading: 330,
      velocity: 95,
      startTime: 20,
      location: { latitude: 29.30, longitude: 34.95, asl: 280, agl: 280 },
      route: [
        { latitude: 29.30, longitude: 34.95, asl: 280, agl: 280 },
        { latitude: 31.25, longitude: 34.79, asl: 200, agl: 200 },
      ],
    },
    {
      id: 12,
      type: DroneType.FalconLongX4,
      heading: 325,
      velocity: 155,
      startTime: 24,
      location: { latitude: 29.55, longitude: 34.70, asl: 500, agl: 500 },
      route: [
        { latitude: 29.55, longitude: 34.70, asl: 500, agl: 500 },
        { latitude: 31.25, longitude: 34.79, asl: 350, agl: 350 },
      ],
    },

    // ══ Wave 6: Western / Mediterranean sea approach ══
    {
      id: 13,
      type: DroneType.SkyMiteC7,
      heading: 90,
      velocity: 125,
      startTime: 12,
      location: { latitude: 32.09, longitude: 33.20, asl: 200, agl: 200 },
      route: [
        { latitude: 32.09, longitude: 33.20, asl: 200, agl: 200 },
        { latitude: 32.09, longitude: 34.78, asl: 150, agl: 150 },
      ],
    },
    {
      id: 14,
      type: DroneType.LoadBeeM2,
      heading: 85,
      velocity: 110,
      startTime: 15,
      location: { latitude: 31.80, longitude: 33.00, asl: 180, agl: 180 },
      route: [
        { latitude: 31.80, longitude: 33.00, asl: 180, agl: 180 },
        { latitude: 31.80, longitude: 34.65, asl: 120, agl: 120 },
      ],
    },
  ],
};

export const defaultScenario: Scenario = JSON.parse(JSON.stringify(sampleScenario));

export function getScenarioById(id: string): Scenario {
  const fullCopy: Scenario = JSON.parse(JSON.stringify(sampleScenario));
  switch (id) {
    case 'sc-1': // Single north threat
      return {
        id: 'sc-1',
        name: 'חדירה חד-זירתית - צפון',
        startTime: 0,
        launchers: [fullCopy.launchers[0]],
        drones: [fullCopy.drones[0], fullCopy.drones[1]],
      };
    case 'sc-2': // Multi north & east
      return {
        id: 'sc-2',
        name: 'רב-זירתי - צפון ומזרח',
        startTime: 0,
        launchers: [fullCopy.launchers[0], fullCopy.launchers[1], fullCopy.launchers[2]],
        drones: [
          fullCopy.drones[0],
          fullCopy.drones[1],
          fullCopy.drones[3],
          fullCopy.drones[5],
          fullCopy.drones[6],
        ],
      };
    case 'sc-3': // Massive attack - 14 drones across all wave corridors
      return fullCopy;
    case 'sc-4': // Single drone west
      return {
        id: 'sc-4',
        name: 'רחפן בודד - חדירה מערבית',
        startTime: 0,
        launchers: [fullCopy.launchers[4]],
        drones: [fullCopy.drones[12]],
      };
    case 'sc-5': // North & South
      return {
        id: 'sc-5',
        name: 'חדירה משולבת - צפון ודרום',
        startTime: 0,
        launchers: [fullCopy.launchers[0], fullCopy.launchers[3]],
        drones: [
          fullCopy.drones[0],
          fullCopy.drones[1],
          fullCopy.drones[8],
          fullCopy.drones[10],
        ],
      };
    case 'sc-6': // Swarm east
      return {
        id: 'sc-6',
        name: 'נחיל רחפנים - גזרה מזרחית',
        startTime: 0,
        launchers: [fullCopy.launchers[1], fullCopy.launchers[2]],
        drones: [
          fullCopy.drones[3],
          fullCopy.drones[4],
          fullCopy.drones[5],
          fullCopy.drones[6],
          fullCopy.drones[7],
        ],
      };
    case 'sc-7': // East & South
      return {
        id: 'sc-7',
        name: 'מתקפה מסונכרנת - מזרח ודרום',
        startTime: 0,
        launchers: [fullCopy.launchers[2], fullCopy.launchers[3]],
        drones: [
          fullCopy.drones[5],
          fullCopy.drones[6],
          fullCopy.drones[7],
          fullCopy.drones[8],
          fullCopy.drones[9],
          fullCopy.drones[10],
        ],
      };
    case 'sc-8': // Recon north
    default:
      return {
        id: 'sc-8',
        name: 'חדירת סיור - גזרת צפון',
        startTime: 0,
        launchers: [fullCopy.launchers[0]],
        drones: [fullCopy.drones[0], fullCopy.drones[2]],
      };
  }
}

