import { DroneGroup, DroneType, InterceptorType, Launcher, LauncherGroup, LauncherType, Location } from '../../../types/types';
import { Direction, ScenarioItem, ScenarioType } from '../types/simulation';

const MOCK_LOCATION: Location = {
  longitude: 1,
  latitude: 1,
  asl: 1,
  agl: 1,
}

const MOCK_LAUNCHERS: Launcher[] = [{
  id: 1,
  location: MOCK_LOCATION,
  type: LauncherType.IronHookSR,
  amount: 1,
  active: true,
  ammunition: [[InterceptorType.BuzzStop15, 1]],
}];

export const INITIAL_SCENARIOS: ScenarioItem[] = [
  {
    id: 'sc-1',
    title: 'חדירה חד-זירתית - צפון',
    severity: 'low',
    type: 'single',
    typeLabel: 'חד-זירתי',
    droneCount: 2,
    entryPoints: ['צפון'],
    droneTypes: ['A', 'B'],
  },
  {
    id: 'sc-2',
    title: 'רב-זירתי - צפון ומזרח',
    severity: 'high',
    type: 'multi',
    typeLabel: 'רב-זירתי',
    droneCount: 5,
    entryPoints: ['צפון', 'מזרח'],
    droneTypes: ['A', 'B', 'C'],
  },
  {
    id: 'sc-3',
    title: 'חדירה מסיבית - 3 גבולות',
    severity: 'extreme',
    type: 'multi',
    typeLabel: 'רב-זירתי',
    droneCount: 10,
    entryPoints: ['צפון', 'מזרח', 'דרום'],
    droneTypes: ['A', 'B', 'C', 'D'],
  },
  {
    id: 'sc-4',
    title: 'רחפן בודד - חדירה מערבית',
    severity: 'low',
    type: 'single',
    typeLabel: 'חד-זירתי',
    droneCount: 1,
    entryPoints: ['מערב'],
    droneTypes: ['A'],
  },
  {
    id: 'sc-5',
    title: 'חדירה משולבת - צפון ודרום',
    severity: 'high',
    type: 'multi',
    typeLabel: 'רב-זירתי',
    droneCount: 4,
    entryPoints: ['צפון', 'דרום'],
    droneTypes: ['B', 'C'],
  },
  {
    id: 'sc-6',
    title: 'נחיל רחפנים - גזרה מזרחית',
    severity: 'extreme',
    type: 'single',
    typeLabel: 'חד-זירתי',
    droneCount: 8,
    entryPoints: ['מזרח'],
    droneTypes: ['A', 'C', 'D'],
  },
  {
    id: 'sc-7',
    title: 'מתקפה מסונכרנת - מזרח ודרום',
    severity: 'high',
    type: 'multi',
    typeLabel: 'רב-זירתי',
    droneCount: 6,
    entryPoints: ['מזרח', 'דרום'],
    droneTypes: ['A', 'B'],
  },
  {
    id: 'sc-8',
    title: 'חדירת סיור - גזרת צפון',
    severity: 'low',
    type: 'single',
    typeLabel: 'חד-זירתי',
    droneCount: 2,
    entryPoints: ['צפון'],
    droneTypes: ['B'],
  },
];

export const INITIAL_DRONE_GROUPS: DroneGroup[] = [
  {
    id: 1,
    name: 'קבוצת חדירה צפונית',
    description: 'חדירה גזרתית מסוג א',
    drones: [
      {
        id: 1,
        location: MOCK_LOCATION,
        heading: 1,
        velocity: 1,
        type: DroneType.FalconLongX4,
      },
      {
        id: 2,
        location: MOCK_LOCATION,
        heading: 2,
        velocity: 2,
        type: DroneType.SkyMiteC7,
      },
    ],
  },
  {
    id: 2,
    name: 'קבוצה רב-זירתית',
    description: 'סיור מזרחי מצפון',
    drones: [
      {
        id: 3,
        location: MOCK_LOCATION,
        heading: 1,
        velocity: 1,
        type: DroneType.FalconLongX4,
      },
    ],
  },
  {
    id: 3,
    name: 'נחיל חדירה מסיבי',
    description: 'עבודה משולבת של 3 רחפנים',
    drones: [
      {
        id: 4,
        location: MOCK_LOCATION,
        heading: 1,
        velocity: 1,
        type: DroneType.FalconLongX4,
      },
      {
        id: 5,
        location: MOCK_LOCATION,
        heading: 2,
        velocity: 2,
        type: DroneType.NanoSwarmQ9,
      },
      {
        id: 6,
        location: MOCK_LOCATION,
        heading: 3,
        velocity: 3,
        type: DroneType.FalconLongX4,
      },
    ],
  },
  {
    id: 4,
    name: 'רחפן בודד - מערב',
    description: 'חדירת יחיד בגזרה מערבית',
    drones: [
      {
        id: 7,
        location: MOCK_LOCATION,
        heading: 1,
        velocity: 1,
        type: DroneType.FalconLongX4,
      },
    ],
  },
  {
    id: 5,
    name: 'קבוצת חדירה משולבת',
    description: 'פעילות צפון ודרום',
    drones: [
      {
        id: 8,
        location: MOCK_LOCATION,
        heading: 1,
        velocity: 1,
        type: DroneType.FalconLongX4,
      },
    ],
  },
  {
    id: 6,
    name: 'נחיל מזרח',
    description: 'נחיל מרוכז בגזרה המזרחית',
    drones: [
      {
        id: 9,
        location: MOCK_LOCATION,
        heading: 1,
        velocity: 1,
        type: DroneType.LoadBeeM2,
      },
    ],
  },
];

export const INITIAL_LAUNCHER_GROUPS: LauncherGroup[] = [
  {
    id: 101,
    name: 'סוללת הגנה צפונית',
    description: 'משגרים פעילים לניטרול טווח קצר',
    launchers: [
      {
        id: 1,
        location: MOCK_LOCATION,
        type: LauncherType.IronHookSR,
        amount: 1,
        active: true,
        ammunition: [[InterceptorType.BuzzStop15, 1]],
      },
      {
        id: 2,
        location: MOCK_LOCATION,
        type: LauncherType.ShieldNestLite,
        amount: 2,
        active: true,
        ammunition: [[InterceptorType.NetWing30, 4]],
      },
    ],
  },
  {
    id: 102,
    name: 'מערך יירוט מרכזי',
    description: 'כיסוי מרחבי ארוך טווח',
    launchers: [
      {
        id: 3,
        location: MOCK_LOCATION,
        type: LauncherType.HorizonEyeMX,
        amount: 1,
        active: true,
        ammunition: [[InterceptorType.SkyLanceM, 2]],
      },
      {
        id: 4,
        location: MOCK_LOCATION,
        type: LauncherType.CloudFenceArea,
        amount: 1,
        active: true,
        ammunition: [[InterceptorType.SwarmMist5, 10]],
      },
    ],
  },
];