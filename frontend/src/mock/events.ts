import {
  DroneGroup,
  DroneType,
  InterceptorType,
  LauncherGroup,
  LauncherType,
  Scenario,
} from "../types/types";
import { Direction, ScenarioItem, ScenarioType } from "../types/simulation";

/*
 * Mock data shaped exactly like the JSON returned by the backend API
 * (see backend/SQL/init.sql and backend/src/services/scenario.service.ts).
 * A drone/launcher is a flat row (longitude/latitude/asl/agl + int type FK
 * + parent group id), a group holds its drones/launchers inline, and a
 * scenario references its groups by id AND has them populated as `dronesGroup`
 * / `launchersGroup`. Anything not in the DB (UI-only `severity` /
 * `entryPoints` on scenarios) is optional.
 */

// ---------------------------------------------------------------------------
// Drone groups (with drones populated)
// ---------------------------------------------------------------------------

export const INITIAL_DRONE_GROUPS: DroneGroup[] = [
  {
    id: 1,
    name: "קבוצת חדירה צפונית",
    description: "חדירה גזרתית מסוג א",
    drones: [
      {
        id: 1,
        dronesGroupId: 1,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        heading: 1,
        velocity: 1,
        type: DroneType.FalconLongX4,
      },
      {
        id: 2,
        dronesGroupId: 1,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        heading: 2,
        velocity: 2,
        type: DroneType.SkyMiteC7,
      },
    ],
  },
  {
    id: 2,
    name: "קבוצה רב-זירתית",
    description: "סיור מזרחי מצפון",
    drones: [
      {
        id: 3,
        dronesGroupId: 2,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        heading: 1,
        velocity: 1,
        type: DroneType.FalconLongX4,
      },
    ],
  },
  {
    id: 3,
    name: "נחיל חדירה מסיבי",
    description: "עבודה משולבת של 3 רחפנים",
    drones: [
      {
        id: 4,
        dronesGroupId: 3,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        heading: 1,
        velocity: 1,
        type: DroneType.FalconLongX4,
      },
      {
        id: 5,
        dronesGroupId: 3,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        heading: 2,
        velocity: 2,
        type: DroneType.NanoSwarmQ9,
      },
      {
        id: 6,
        dronesGroupId: 3,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        heading: 3,
        velocity: 3,
        type: DroneType.FalconLongX4,
      },
    ],
  },
  {
    id: 4,
    name: "רחפן בודד - מערב",
    description: "חדירת יחיד בגזרה מערבית",
    drones: [
      {
        id: 7,
        dronesGroupId: 4,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        heading: 1,
        velocity: 1,
        type: DroneType.FalconLongX4,
      },
    ],
  },
  {
    id: 5,
    name: "קבוצת חדירה משולבת",
    description: "פעילות צפון ודרום",
    drones: [
      {
        id: 8,
        dronesGroupId: 5,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        heading: 1,
        velocity: 1,
        type: DroneType.FalconLongX4,
      },
    ],
  },
  {
    id: 6,
    name: "נחיל מזרח",
    description: "נחיל מרוכז בגזרה המזרחית",
    drones: [
      {
        id: 9,
        dronesGroupId: 6,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        heading: 1,
        velocity: 1,
        type: DroneType.LoadBeeM2,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Launcher groups (with launchers populated)
// ---------------------------------------------------------------------------

export const INITIAL_LAUNCHER_GROUPS: LauncherGroup[] = [
  {
    id: 101,
    name: "סוללת הגנה צפונית",
    description: "משגרים פעילים לניטרול טווח קצר",
    launchers: [
      {
        id: 1,
        launchersGroupId: 101,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        type: LauncherType.IronHookSR,
        amount: 1,
        active: true,
        ammunition: [
          { launcherId: 1, interceptorTypeId: InterceptorType.BuzzStop15, amount: 1 },
        ],
      },
      {
        id: 2,
        launchersGroupId: 101,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        type: LauncherType.ShieldNestLite,
        amount: 2,
        active: true,
        ammunition: [
          { launcherId: 2, interceptorTypeId: InterceptorType.NetWing30, amount: 4 },
        ],
      },
    ],
  },
  {
    id: 102,
    name: "מערך יירוט מרכזי",
    description: "כיסוי מרחבי ארוך טווח",
    launchers: [
      {
        id: 3,
        launchersGroupId: 102,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        type: LauncherType.HorizonEyeMX,
        amount: 1,
        active: true,
        ammunition: [
          { launcherId: 3, interceptorTypeId: InterceptorType.SkyLanceM, amount: 2 },
        ],
      },
      {
        id: 4,
        launchersGroupId: 102,
        longitude: 1,
        latitude: 1,
        asl: 1,
        agl: 1,
        type: LauncherType.CloudFenceArea,
        amount: 1,
        active: true,
        ammunition: [
          { launcherId: 4, interceptorTypeId: InterceptorType.SwarmMist5, amount: 10 },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Scenarios — DB-shaped, with populated dronesGroup / launchersGroup and
// optional UI-only severity/entryPoints
// ---------------------------------------------------------------------------

const findDroneGroup = (id: number): DroneGroup | undefined =>
  INITIAL_DRONE_GROUPS.find((g) => g.id === id);
const findLauncherGroup = (id: number): LauncherGroup | undefined =>
  INITIAL_LAUNCHER_GROUPS.find((g) => g.id === id);

const buildScenario = (
  base: Scenario,
  ui: { severity?: ScenarioItem["severity"]; entryPoints?: Direction[] } = {},
): ScenarioItem => ({
  ...base,
  dronesGroup: findDroneGroup(base.dronesGroupId),
  launchersGroup: findLauncherGroup(base.launchersGroupId),
  ...ui,
});

export const INITIAL_SCENARIOS: ScenarioItem[] = [
  buildScenario(
    {
      id: "sc-1",
      name: "חדירה חד-זירתית - צפון",
      dronesGroupId: 1,
      launchersGroupId: 101,
      type: ScenarioType.SINGLE_AREA,
    },
    { severity: "low", entryPoints: [Direction.NORTH] },
  ),
  buildScenario(
    {
      id: "sc-2",
      name: "רב-זירתי - צפון ומזרח",
      dronesGroupId: 2,
      launchersGroupId: 101,
      type: ScenarioType.MULTIPLE_AREAS,
    },
    { severity: "high", entryPoints: [Direction.NORTH, Direction.EAST] },
  ),
  buildScenario(
    {
      id: "sc-3",
      name: "חדירה מסיבית - 3 גבולות",
      dronesGroupId: 3,
      launchersGroupId: 102,
      type: ScenarioType.MULTIPLE_AREAS,
    },
    {
      severity: "extreme",
      entryPoints: [Direction.NORTH, Direction.EAST, Direction.SOUTH],
    },
  ),
  buildScenario(
    {
      id: "sc-4",
      name: "רחפן בודד - חדירה מערבית",
      dronesGroupId: 4,
      launchersGroupId: 101,
      type: ScenarioType.SINGLE_AREA,
    },
    { severity: "low", entryPoints: [Direction.WEST] },
  ),
  buildScenario(
    {
      id: "sc-5",
      name: "חדירה משולבת - צפון ודרום",
      dronesGroupId: 5,
      launchersGroupId: 102,
      type: ScenarioType.MULTIPLE_AREAS,
    },
    { severity: "high", entryPoints: [Direction.NORTH, Direction.SOUTH] },
  ),
  buildScenario(
    {
      id: "sc-6",
      name: "נחיל רחפנים - גזרה מזרחית",
      dronesGroupId: 6,
      launchersGroupId: 102,
      type: ScenarioType.SINGLE_AREA,
    },
    { severity: "extreme", entryPoints: [Direction.EAST] },
  ),
  buildScenario(
    {
      id: "sc-7",
      name: "מתקפה מסונכרנת - מזרח ודרום",
      dronesGroupId: 3,
      launchersGroupId: 102,
      type: ScenarioType.MULTIPLE_AREAS,
    },
    { severity: "high", entryPoints: [Direction.EAST, Direction.SOUTH] },
  ),
  buildScenario(
    {
      id: "sc-8",
      name: "חדירת סיור - גזרת צפון",
      dronesGroupId: 1,
      launchersGroupId: 101,
      type: ScenarioType.SINGLE_AREA,
    },
    { severity: "low", entryPoints: [Direction.NORTH] },
  ),
];
