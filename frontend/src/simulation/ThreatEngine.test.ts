import { describe, it, expect } from 'vitest';
import { calculateProgress, calculatePositionAlongRoute, activateWaitingThreats, advanceThreatPositions } from './ThreatEngine';
import { DroneType } from '../types/types';

const loc = (lat: number, lng: number) => ({ latitude: lat, longitude: lng, asl: 0, agl: 0 });
const route = [loc(32.0, 35.0), loc(32.5, 35.0), loc(33.0, 35.0)];
const base = { id: 1, type: DroneType.SkyMiteC7, heading: 0, velocity: 100, startTime: 0,
  location: loc(32, 35), logicalStatus: 'active' as const, visualStatus: 'flying' as const, progress: 0, route };

it('calculateProgress 0 at elapsed=0', () => expect(calculateProgress(route, 100, 0)).toBe(0));
it('calculateProgress clamps to 1', () => expect(calculateProgress(route, 100, 999999)).toBe(1));
it('position at progress 0 = first point', () => expect(calculatePositionAlongRoute(route, 0).latitude).toBeCloseTo(32.0, 5));
it('position at progress 1 = last point', () => expect(calculatePositionAlongRoute(route, 1).latitude).toBeCloseTo(33.0, 5));
it('position at progress 0.5 = midpoint', () => expect(calculatePositionAlongRoute(route, 0.5).latitude).toBeCloseTo(32.5, 3));
it('activates waiting threat on time', () => {
  const t = { ...base, logicalStatus: 'waiting' as const, startTime: 5 };
  expect(activateWaitingThreats({ 1: t }, 5)[1].logicalStatus).toBe('active');
});
it('does not activate before startTime', () => {
  const t = { ...base, logicalStatus: 'waiting' as const, startTime: 10 };
  expect(activateWaitingThreats({ 1: t }, 5)[1].logicalStatus).toBe('waiting');
});
it('advances active threat position', () => expect(advanceThreatPositions({ 1: base }, 10)[1].progress).toBeGreaterThan(0));
it('does not move waiting threat', () => {
  const t = { ...base, logicalStatus: 'waiting' as const };
  expect(advanceThreatPositions({ 1: t }, 10)[1].progress).toBe(0);
});
