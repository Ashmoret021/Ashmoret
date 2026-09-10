/**
 * visual/VisualEventQueue.ts
 *
 * Developer 3 – Mission 3.3
 *
 * Manages the ordered queue of VisualEvents.
 *
 * Responsibilities:
 *  • Accept new events from VisualEventBuilder.
 *  • Advance event lifecycle (pending → active → finished) based on simulationTime.
 *  • Expose the current active events to LeafletRenderer (60 FPS render loop).
 *  • Notify subscriber callbacks on every mutation (used by EventLog / Dev 4).
 *  • Support full reset on Restart (spec §29).
 *
 * Spec references: §17, §29
 */

import type { VisualEvent, VisualStatus } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A listener called whenever the queue contents change. */
export type QueueListener = (events: readonly VisualEvent[]) => void;

// ---------------------------------------------------------------------------
// VisualEventQueue
// ---------------------------------------------------------------------------

export class VisualEventQueue {
  /** Internal storage, kept sorted by startTime ascending. */
  private events: VisualEvent[] = [];

  /** Registered change listeners (e.g. EventLog component from Dev 4). */
  private listeners = new Set<QueueListener>();

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Adds a new event to the queue, inserting it in sorted order by `startTime`.
   * Duplicate IDs are silently ignored to prevent double-processing.
   *
   * Spec §17
   */
  enqueue(event: VisualEvent): void {
    // Guard against duplicates (algorithm may send repeat decisions)
    if (this.events.some((e) => e.id === event.id)) {
      return;
    }

    // Insert sorted by startTime (binary-search insertion)
    const insertAt = this.findInsertionIndex(event.startTime);
    this.events.splice(insertAt, 0, { ...event });

    this.notify();
  }

  /**
   * Advances every event's `status` according to the current simulation time.
   *
   *  pending  → active   when simulationTime >= event.startTime
   *  active   → finished when event.endTime is defined AND simulationTime > event.endTime
   *
   * Call this once per simulation tick (not per render frame — status changes
   * don't need 60 FPS granularity).
   *
   * Returns `true` if any event changed status (useful for dirty-checking).
   */
  tick(simulationTime: number): boolean {
    let changed = false;

    for (const event of this.events) {
      const next = computeStatus(event, simulationTime);
      if (next !== event.status) {
        event.status = next;
        changed = true;
      }
    }

    if (changed) {
      this.notify();
    }

    return changed;
  }

  /**
   * Removes all events whose status is `'finished'` from the queue.
   * Call this periodically (e.g. once per second of simulation time) to keep
   * memory usage bounded in long-running scenarios.
   *
   * Returns the number of events pruned.
   */
  pruneFinished(): number {
    const before = this.events.length;
    this.events = this.events.filter((e) => e.status !== 'finished');
    const pruned = before - this.events.length;
    if (pruned > 0) {
      this.notify();
    }
    return pruned;
  }

  /**
   * Returns a snapshot of all currently `active` events.
   * Called by LeafletRenderer on every render frame.
   */
  getActiveEvents(): VisualEvent[] {
    return this.events.filter((e) => e.status === 'active');
  }

  /**
   * Returns a snapshot of all events regardless of status.
   * Used by EventLog (Dev 4) to display a chronological history.
   */
  getAllEvents(): readonly VisualEvent[] {
    return this.events;
  }

  /**
   * Returns a snapshot of events with a given status.
   */
  getEventsByStatus(status: VisualStatus): VisualEvent[] {
    return this.events.filter((e) => e.status === status);
  }

  /**
   * Returns the count of events in each status bucket — useful for HUD stats.
   */
  getStatusCounts(): Record<VisualStatus, number> {
    const counts: Record<VisualStatus, number> = {
      pending: 0,
      active: 0,
      finished: 0,
    };
    for (const e of this.events) {
      counts[e.status]++;
    }
    return counts;
  }

  /**
   * Completely clears all events from the queue.
   * Must be called on Restart (spec §29 — "מחיקת Visual Events").
   */
  clear(): void {
    this.events = [];
    this.notify();
  }

  /**
   * Registers a listener that is called whenever the queue changes.
   * Returns an unsubscribe function.
   *
   * @example
   * const unsub = queue.subscribe((events) => console.log(events));
   * // later:
   * unsub();
   */
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    // Immediately fire with current state so consumer can initialise.
    listener(this.events);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Total number of events in the queue (all statuses).
   */
  get size(): number {
    return this.events.length;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /** Notifies all registered listeners with the current event list. */
  private notify(): void {
    // Provide a shallow copy so listeners cannot mutate internal state.
    const snapshot = [...this.events] as readonly VisualEvent[];
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  /**
   * Binary search to find the index at which a new event with `startTime`
   * should be inserted to keep the array sorted.
   */
  private findInsertionIndex(startTime: number): number {
    let lo = 0;
    let hi = this.events.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.events[mid].startTime <= startTime) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton
//
// The renderer and engine both import this shared instance so they always
// operate on the same queue without prop-drilling or a React context.
// ---------------------------------------------------------------------------

/**
 * The shared VisualEventQueue instance used across the simulation.
 *
 * Import and use directly:
 * ```ts
 * import { visualEventQueue } from './VisualEventQueue';
 *
 * // In the simulation tick (after receiving engagement decisions):
 * visualEventQueue.enqueue(bundle.visualEvent);
 * visualEventQueue.tick(simulationTime);
 *
 * // In the render loop:
 * const active = visualEventQueue.getActiveEvents();
 *
 * // On Restart:
 * visualEventQueue.clear();
 * ```
 */
export const visualEventQueue = new VisualEventQueue();

// ---------------------------------------------------------------------------
// Pure helper (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Determines what status an event should have at a given simulation time.
 * Pure function — does not mutate the event.
 */
export function computeStatus(event: VisualEvent, simulationTime: number): VisualStatus {
  if (simulationTime < event.startTime) {
    return 'pending';
  }
  if (event.endTime !== undefined && simulationTime > event.endTime) {
    return 'finished';
  }
  return 'active';
}
