import {
  DroneType,
  InterceptorType,
  LauncherType,
} from '../../../types/types';
import type { Scenario } from './SimulationContext';

export const sampleScenario: Scenario = {
  id: 'scenario-01',
  name: 'תרחיש איום משולב - מרכז הארץ',
  startTime: 0,
  launchers: [
    {
      id: 101,
      type: LauncherType.IronHookSR,
      active: true,
      amount: 20,
      location: {
        latitude: 32.0853,
        longitude: 34.7818,
        asl: 30,
        agl: 0,
      },
      ammunition: [
        [InterceptorType.BuzzStop15, 10],
        [InterceptorType.DartFoxS, 10],
      ],
    },
    {
      id: 102,
      type: LauncherType.ShieldNestLite,
      active: true,
      amount: 15,
      location: {
        latitude: 31.7683,
        longitude: 35.2137,
        asl: 750,
        agl: 0,
      },
      ammunition: [
        [InterceptorType.SkyLanceM, 15],
      ],
    },
  ],
  drones: [
    {
      id: 1,
      type: DroneType.SkyMiteC7,
      heading: 180,
      velocity: 120,
      startTime: 2,
      location: {
        latitude: 32.4000,
        longitude: 34.9000,
        asl: 500,
        agl: 500,
      },
      route: [
        { latitude: 32.4000, longitude: 34.9000, asl: 500, agl: 500 },
        { latitude: 32.0853, longitude: 34.7818, asl: 400, agl: 400 },
      ],
    },
    {
      id: 2,
      type: DroneType.FalconLongX4,
      heading: 195,
      velocity: 150,
      startTime: 5,
      location: {
        latitude: 32.3500,
        longitude: 35.1000,
        asl: 800,
        agl: 800,
      },
      route: [
        { latitude: 32.3500, longitude: 35.1000, asl: 800, agl: 800 },
        { latitude: 31.7683, longitude: 35.2137, asl: 600, agl: 600 },
      ],
    },
  ],
};
