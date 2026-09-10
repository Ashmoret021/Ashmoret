/**
 * visual/types.ts
 *
 * Type definitions for the Visual Event layer (Developer 3).
 *
 * This layer sits between the Algorithm API decisions and the Leaflet Renderer.
 * It is responsible for translating logical engagement decisions into time-bound
 * visual events that the renderer can display at the correct simulation time.
 *
 * Architecture position:
 *   EngagementDecision (Dev 2)
 *     → VisualEventBuilder (Dev 3)
 *     → VisualEventQueue  (Dev 3)
 *     → LeafletRenderer   (Dev 3)
 */

import type { Location } from '../../../types/types';

// ---------------------------------------------------------------------------
// Coordinate alias
// The project uses `Location` (lat, lng, asl, agl) from the shared types.
// Within the visual layer we use `LatLng` as a semantic alias for the
// map-relevant subset so that code reads closer to Leaflet conventions.
// ---------------------------------------------------------------------------
export type LatLng = Pick<Location, 'latitude' | 'longitude'>;

// ---------------------------------------------------------------------------
// Visual Event Type
// Describes what kind of visual event is being represented.
//
//  launch       – an interceptor is being launched from a defense system
//  interception – interceptor and threat converge on an intercept point
//  impact       – a threat reaches the end of its route without being intercepted
//  miss         – an interceptor fails to hit its target and is removed
// ---------------------------------------------------------------------------
export type VisualEventType = 'launch' | 'interception' | 'impact' | 'miss';

// ---------------------------------------------------------------------------
// Visual Status
// Lifecycle of a VisualEvent inside the VisualEventQueue.
//
//  pending  – event is queued but simulationTime has not yet reached startTime
//  active   – simulationTime is within [startTime, endTime]; being rendered
//  finished – simulationTime has passed endTime; safe to prune from queue
// ---------------------------------------------------------------------------
export type VisualStatus = 'pending' | 'active' | 'finished';

// ---------------------------------------------------------------------------
// VisualEvent
// A single time-bound visual occurrence that the LeafletRenderer will display.
// ---------------------------------------------------------------------------
export interface VisualEvent {
  /** Unique identifier for this event (e.g. "evt-interception-red42-t120") */
  id: string;

  /** What kind of visual event this is */
  type: VisualEventType;

  /** Simulation time (seconds) at which this event becomes active */
  startTime: number;

  /**
   * Simulation time (seconds) at which this event is considered finished.
   * Optional – events like `impact` may have no defined end (they linger).
   */
  endTime?: number;

  /**
   * ID of the threat entity associated with this event.
   * Used by the renderer to look up the correct marker.
   */
  targetId?: string;

  /**
   * ID of the interceptor entity associated with this event.
   * Used by the renderer to look up the correct interceptor marker.
   */
  interceptorId?: string;

  /**
   * Spatial location relevant to the event.
   * For `interception` and `impact`: the point where the event occurs on the map.
   * For `launch`: the defense-system position where the interceptor originates.
   */
  position?: LatLng;

  /** Current lifecycle status of this event within the VisualEventQueue */
  status: VisualStatus;
}

// ---------------------------------------------------------------------------
// InterceptorVisualState
// Tracks the visual-layer representation of an in-flight interceptor.
// This mirrors the logical InterceptorState (owned by Dev 1) but lives
// exclusively in the visual layer so Leaflet state never bleeds into logic.
// ---------------------------------------------------------------------------
export interface InterceptorVisualState {
  /** Matches the logical interceptor ID created by VisualEventBuilder */
  id: string;

  /** Type label used for icon selection (e.g. "DartFox-S") */
  type: string;

  /** ID of the defense system that launched this interceptor */
  sourceSystemId: string;

  /** ID of the threat this interceptor is targeting */
  targetId: string;

  /**
   * Visual lifecycle status.
   *
   *  flying           – interceptor marker is moving toward interceptPoint
   *  exploding        – brief explosion animation at interceptPoint (success)
   *  missing          – brief fade-out animation (miss / failure)
   *  finished         – marker can be removed from the map
   */
  visualStatus: 'flying' | 'exploding' | 'missing' | 'finished';

  /** Simulation time at which the interceptor was launched */
  launchTime: number;

  /** Current interpolated position of the interceptor marker */
  position: LatLng;

  /** Origin of the interceptor (defense system position) */
  startPosition: LatLng;

  /**
   * Where the interceptor and threat will meet.
   * Calculated deterministically by VisualEventBuilder:
   *   interceptPoint = getThreatPositionAtTime(simulationTime + VISUAL_INTERCEPT_DURATION_S)
   */
  interceptPoint: LatLng;

  /**
   * 0..1 interpolation progress from startPosition → interceptPoint.
   * Updated each render frame by the LeafletRenderer.
   */
  progress: number;

  /** Whether the engagement was expected to succeed or fail */
  outcome: 'success' | 'failure';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * How many simulation-seconds the interceptor flight animation lasts.
 * Used by VisualEventBuilder to project the future intercept point.
 * Spec §15: `visualInterceptDuration = 3 seconds`
 */
export const VISUAL_INTERCEPT_DURATION_S = 3;
