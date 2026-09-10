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

function cloneThreats(threats: Record<number, DroneSimState>): Record<number, DroneSimState> {
  const copy: Record<number, DroneSimState> = {};
  for (const [k, v] of Object.entries(threats)) {
    copy[Number(k)] = { ...v, location: { ...v.location } };
  }
  return copy;
}

function cloneLaunchers(launchers: Record<number, LauncherSimState>): Record<number, LauncherSimState> {
  const copy: Record<number, LauncherSimState> = {};
  for (const [k, v] of Object.entries(launchers)) {
    copy[Number(k)] = { ...v, location: { ...v.location } };
  }
  return copy;
}

function cloneInterceptors(interceptors: Record<string, InterceptorSimState>): Record<string, InterceptorSimState> {
  const copy: Record<string, InterceptorSimState> = {};
  for (const [k, v] of Object.entries(interceptors)) {
    copy[k] = { ...v, location: { ...v.location } };
  }
  return copy;
}

function recordSnapshot() {
  historyRecords.push({
    simulationTime: state.simulationTime,
    threats: cloneThreats(state.threats),
    launchers: cloneLaunchers(state.launchers),
    interceptors: cloneInterceptors(state.interceptors),
    visualEvents: [...state.visualEvents],
    logHistory: [...state.logHistory],
  });
}

function notifyStateListeners() {
  stateListeners.forEach((listener) => listener());
}

function getRecordedFrontierTime(): number {
  if (historyRecords.length === 0) return 0;
  return historyRecords[historyRecords.length - 1].simulationTime;
}

function findClosestSnapshot(targetTime: number): SimulationSnapshot | null {
  if (historyRecords.length === 0) return null;
  let low = 0;
  let high = historyRecords.length - 1;

  if (targetTime <= historyRecords[0].simulationTime) {
    return historyRecords[0];
  }
  if (targetTime >= historyRecords[high].simulationTime) {
    return historyRecords[high];
  }

  while (low <= high) {
    const mid = (low + high) >> 1;
    const midTime = historyRecords[mid].simulationTime;

    if (midTime === targetTime) {
      return historyRecords[mid];
    } else if (midTime < targetTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const left = historyRecords[high];
  const right = historyRecords[low];
  if (!left) return right;
  if (!right) return left;
  return targetTime - left.simulationTime <= right.simulationTime - targetTime
    ? left
    : right;
}

let isReplayCompleted = false;

function clockLoop(timestamp: number) {
  if (state.status !== 'running') {
    rafHandle = null;
    lastTimestamp = null;
    return;
  }

  const delta = lastTimestamp === null
    ? 0
    : Math.min((timestamp - lastTimestamp) / 1000, 0.1);

  const newTime = state.simulationTime + delta * state.speedMultiplier;
  const recordedFrontier = getRecordedFrontierTime();

  if (isReplayCompleted) {
    // Replay mode — entire scenario was previously completed
    if (newTime >= state.maxSimulationTime) {
      seekToTime(state.maxSimulationTime, true);
      state = { ...state, status: 'finished' };
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
        rafHandle = null;
      }
      lastTimestamp = null;
      notifyStateListeners();
      return;
    } else {
      seekToTime(newTime, true);
    }
  } else if (newTime < recordedFrontier) {
    // Replay mode for already-calculated situations (user scrubbed backward before simulation finished)
    // Run on already calculated snapshots without recalculating or generating duplicate records
    seekToTime(newTime, true);
  } else {
    // Live simulation mode — at or beyond the recorded frontier
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

  if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }
  lastTimestamp = null;
  state = { ...state, status: 'paused' };
  notifyStateListeners();
}

export function resumeClock() {
  if (state.status === 'running') {
    return;
  }

  state = { ...state, status: 'running' };
  lastTimestamp = null;
  if (rafHandle === null) {
    rafHandle = requestAnimationFrame(clockLoop);
  }
  notifyStateListeners();
}

export function stopClock() {
  if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }

  lastTimestamp = null;
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

  let nextStatus = state.status;
  if (!preserveStatus && state.status === 'running') {
    nextStatus = 'paused';
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
  } else if (state.status === 'finished' && targetTime < state.maxSimulationTime - 0.05) {
    nextStatus = 'paused';
  }

  lastTimestamp = null;

  const closest = findClosestSnapshot(targetTime);
  if (!closest) return;

  state = {
    ...state,
    simulationTime: targetTime,
    threats: cloneThreats(closest.threats),
    launchers: cloneLaunchers(closest.launchers),
    interceptors: cloneInterceptors(closest.interceptors),
    visualEvents: [...closest.visualEvents],
    logHistory: [...(closest.logHistory || [])],
    status: nextStatus,
  };
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

export function clearScenario() {
  stopClock();
  historyRecords = [];
  isReplayCompleted = false;
  _logIdCounter = 0;
  state = createEmptyState();
  lastTimestamp = null;
  notifyStateListeners();
}