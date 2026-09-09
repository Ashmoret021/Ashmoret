import type {
  Drone,
  InterceptorType,
  Launcher,
  Location,
} from '../../../types/types';

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'finished';
export type SpeedMultiplier = 1 | 2 | 5 | 10;

export type DroneLogicalStatus =
  | 'waiting'
  | 'active'
  | 'interceptPending'
  | 'intercepted'
  | 'impacted';

export type DroneVisualStatus =
  | 'hidden'
  | 'flying'
  | 'flying_to_intercept'
  | 'intercepted'
  | 'impacted';

export interface DroneSimState extends Drone {
  logicalStatus: DroneLogicalStatus;
  visualStatus: DroneVisualStatus;
  progress: number;
  route: Location[];
  startTime: number;
}

export interface LauncherSimState extends Launcher {
  lastFiredAt: number;
}

export interface InterceptorSimState {
  id: string;
  launcherId: number;
  targetDroneId: number;
  type: InterceptorType;
  location: Location;
  progress: number;
  status: 'flying' | 'intercepted' | 'missed';
  launchedAt: number;
}

export interface VisualEvent {
  id: string;
  type: string;
  location: Location;
  createdAt: number;
  duration?: number;
}

export interface SimulationState {
  simulationTime: number;
  status: SimulationStatus;
  speedMultiplier: SpeedMultiplier;
  threats: Record<number, DroneSimState>;
  launchers: Record<number, LauncherSimState>;
  interceptors: Record<string, InterceptorSimState>;
  visualEvents: VisualEvent[];
}

export interface Scenario {
  id: number | string;
  name: string;
  startTime: number;
  drones: Array<Drone & { startTime: number; route: Location[] }>;
  launchers: Launcher[];
}

export type TickCallback = (
  deltaTime: number,
  simulationTime: number,
) => void;

export type StateListener = () => void;

let state = createEmptyState();
let rafHandle: number | null = null;
let lastTimestamp: number | null = null;
const tickCallbacks = new Set<TickCallback>();
const stateListeners = new Set<StateListener>();

function createEmptyState(): SimulationState {
  return {
    simulationTime: 0,
    status: 'idle',
    speedMultiplier: 1,
    threats: {},
    launchers: {},
    interceptors: {},
    visualEvents: [],
  };
}

function notifyStateListeners() {
  stateListeners.forEach((listener) => listener());
}

function clockLoop(timestamp: number) {
  if (state.status === 'running') {
    const delta = lastTimestamp === null
      ? 0
      : Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    state = {
      ...state,
      simulationTime: state.simulationTime + delta * state.speedMultiplier,
    };
    tickCallbacks.forEach((callback) => callback(delta, state.simulationTime));
    notifyStateListeners();
  }

  lastTimestamp = timestamp;
  rafHandle = requestAnimationFrame(clockLoop);
}

export function getState(): SimulationState {
  return state;
}

export function setState(partial: Partial<SimulationState>) {
  state = { ...state, ...partial };
  notifyStateListeners();
}

export function subscribe(listener: StateListener): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

export function startClock() {
  if (rafHandle !== null) {
    return;
  }

  state = { ...state, status: 'running' };
  lastTimestamp = null;
  rafHandle = requestAnimationFrame(clockLoop);
  notifyStateListeners();
}

export function pauseClock() {
  if (state.status !== 'running') {
    return;
  }

  state = { ...state, status: 'paused' };
  notifyStateListeners();
}

export function resumeClock() {
  if (rafHandle === null) {
    startClock();
    return;
  }

  state = { ...state, status: 'running' };
  lastTimestamp = null;
  notifyStateListeners();
}

export function stopClock() {
  if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
  }

  rafHandle = null;
  lastTimestamp = null;
  state = { ...state, status: 'idle' };
  notifyStateListeners();
}

export function setSpeed(multiplier: SpeedMultiplier) {
  state = { ...state, speedMultiplier: multiplier };
  notifyStateListeners();
}

export function onTick(callback: TickCallback): () => void {
  tickCallbacks.add(callback);
  return () => tickCallbacks.delete(callback);
}

export function loadScenario(scenario: Scenario) {
  const threats: Record<number, DroneSimState> = {};
  for (const drone of scenario.drones) {
    threats[drone.id] = {
      ...drone,
      logicalStatus: 'waiting',
      visualStatus: 'hidden',
      progress: 0,
      location: drone.route[0] ?? drone.location,
    };
  }

  const launchers: Record<number, LauncherSimState> = {};
  for (const launcher of scenario.launchers) {
    launchers[launcher.id] = { ...launcher, lastFiredAt: -Infinity };
  }

  state = {
    simulationTime: scenario.startTime,
    status: 'idle',
    speedMultiplier: 1,
    threats,
    launchers,
    interceptors: {},
    visualEvents: [],
  };
  lastTimestamp = null;
  notifyStateListeners();
}