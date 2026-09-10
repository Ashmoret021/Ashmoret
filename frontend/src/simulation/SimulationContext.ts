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

export interface LogEntry {
  id: string;
  time: number;
  category: 'launch' | 'interception' | 'impact' | 'detection';
  title: string;
  description: string;
  location?: { latitude: number; longitude: number };
}

export interface SimulationSnapshot {
  simulationTime: number;
  threats: Record<number, DroneSimState>;
  launchers: Record<number, LauncherSimState>;
  interceptors: Record<string, InterceptorSimState>;
  visualEvents: VisualEvent[];
  logHistory: LogEntry[];
}

export interface SimulationState {
  simulationTime: number;
  maxSimulationTime: number;
  status: SimulationStatus;
  speedMultiplier: SpeedMultiplier;
  threats: Record<number, DroneSimState>;
  launchers: Record<number, LauncherSimState>;
  interceptors: Record<string, InterceptorSimState>;
  visualEvents: VisualEvent[];
  logHistory: LogEntry[];
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
let historyRecords: SimulationSnapshot[] = [];
let rafHandle: number | null = null;
let lastTimestamp: number | null = null;
let currentScenario: Scenario | null = null;
const tickCallbacks = new Set<TickCallback>();
const stateListeners = new Set<StateListener>();

function createEmptyState(): SimulationState {
  return {
    simulationTime: 0,
    maxSimulationTime: 0,
    status: 'idle',
    speedMultiplier: 1,
    threats: {},
    launchers: {},
    interceptors: {},
    visualEvents: [],
    logHistory: [],
  };
}

let _logIdCounter = 0;
export function appendLog(
  category: LogEntry['category'],
  title: string,
  description: string,
  location?: { latitude: number; longitude: number },
) {
  const entry: LogEntry = {
    id: `log-${++_logIdCounter}`,
    time: state.simulationTime,
    category,
    title,
    description,
    location,
  };
  state = {
    ...state,
    logHistory: [...state.logHistory, entry],
  };
  notifyStateListeners();
}

function recordSnapshot() {
  historyRecords.push({
    simulationTime: state.simulationTime,
    threats: JSON.parse(JSON.stringify(state.threats)),
    launchers: JSON.parse(JSON.stringify(state.launchers)),
    interceptors: JSON.parse(JSON.stringify(state.interceptors)),
    visualEvents: JSON.parse(JSON.stringify(state.visualEvents)),
    logHistory: [...state.logHistory],
  });
}

function notifyStateListeners() {
  stateListeners.forEach((listener) => listener());
}

let isReplayCompleted = false;

function clockLoop(timestamp: number) {
  if (state.status === 'running') {
    const delta = lastTimestamp === null
      ? 0
      : Math.min((timestamp - lastTimestamp) / 1000, 0.1);

    const newTime = state.simulationTime + delta * state.speedMultiplier;

    if (isReplayCompleted && historyRecords.length > 0) {
      // Replay mode — scrubbing or playing back recorded history
      if (newTime >= state.maxSimulationTime) {
        seekToTime(state.maxSimulationTime, true);
        state = { ...state, status: 'finished' };
        if (rafHandle !== null) {
          cancelAnimationFrame(rafHandle);
          rafHandle = null;
        }
        notifyStateListeners();
      } else {
        seekToTime(newTime, true);
        tickCallbacks.forEach((callback) => callback(delta, state.simulationTime));
      }
    } else {
      // Live simulation mode
      const newMaxTime = Math.max(state.maxSimulationTime, newTime);
      state = {
        ...state,
        simulationTime: newTime,
        maxSimulationTime: newMaxTime,
      };
      recordSnapshot();
      tickCallbacks.forEach((callback) => callback(delta, state.simulationTime));
      notifyStateListeners();
    }
  }

  lastTimestamp = timestamp;
  if (state.status === 'running') {
    rafHandle = requestAnimationFrame(clockLoop);
  } else {
    rafHandle = null;
  }
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
  rafHandle = requestAnimationFrame(clockLoop);
  notifyStateListeners();
}

export function stopClock() {
  if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
  }

  rafHandle = null;
  lastTimestamp = null;
  isReplayCompleted = false;
  state = { ...state, status: 'idle' };
  notifyStateListeners();
}

export function finishClock() {
  isReplayCompleted = true;
  state = { ...state, status: 'finished' };
  notifyStateListeners();
}

export function setSpeed(multiplier: SpeedMultiplier) {
  state = { ...state, speedMultiplier: multiplier };
  notifyStateListeners();
}

export function seekToTime(targetTime: number, preserveStatus: boolean = false) {
  if (historyRecords.length === 0) return;

  if (state.status === 'running' && !preserveStatus) {
    pauseClock();
  }

  let closest = historyRecords[0];
  let minDiff = Math.abs(closest.simulationTime - targetTime);

  for (let i = 1; i < historyRecords.length; i++) {
    const diff = Math.abs(historyRecords[i].simulationTime - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = historyRecords[i];
    }
  }

  state = {
    ...state,
    simulationTime: targetTime,
    threats: JSON.parse(JSON.stringify(closest.threats)),
    launchers: JSON.parse(JSON.stringify(closest.launchers)),
    interceptors: JSON.parse(JSON.stringify(closest.interceptors)),
    visualEvents: JSON.parse(JSON.stringify(closest.visualEvents)),
    logHistory: JSON.parse(JSON.stringify(closest.logHistory || [])),
    status: preserveStatus ? state.status : state.status,
  };
  notifyStateListeners();
}

export function onTick(callback: TickCallback): () => void {
  tickCallbacks.add(callback);
  return () => tickCallbacks.delete(callback);
}

export function loadScenario(scenario: Scenario) {
  currentScenario = scenario;
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

  historyRecords = [];
  isReplayCompleted = false;
  _logIdCounter = 0;

  state = {
    simulationTime: scenario.startTime,
    maxSimulationTime: scenario.startTime,
    status: 'idle',
    speedMultiplier: 1,
    threats,
    launchers,
    interceptors: {},
    visualEvents: [],
    logHistory: [],
  };
  recordSnapshot();
  lastTimestamp = null;
  notifyStateListeners();
}

export function reloadCurrentScenario() {
  if (currentScenario) {
    loadScenario(currentScenario);
  }
}

export function clearScenario() {
  stopClock();
  historyRecords = [];
  isReplayCompleted = false;
  _logIdCounter = 0;
  state = createEmptyState();
  lastTimestamp = null;
  notifyStateListeners();
}