// Iron Contract — Event Queue (GDD v2.0, pure, deterministic)
// Priority-based event queue with day-based expiration.

import type { GameEvent, EventPriority } from '@/types/events';

// === Priority Ordering ===

const PRIORITY_ORDER: Record<EventPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/** Sort events by priority (critical first), then by day (oldest first). */
export function sortByPriority(events: GameEvent[]): GameEvent[] {
  return [...events].sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pDiff !== 0) return pDiff;
    return a.day - b.day;
  });
}

// === Queue Operations ===

/** Add events to queue, maintaining priority order. Returns new array. */
export function enqueueEvents(
  queue: GameEvent[],
  newEvents: GameEvent[]
): GameEvent[] {
  return sortByPriority([...queue, ...newEvents]);
}

/** Remove resolved events from queue. Returns new array. */
export function dequeueResolved(queue: GameEvent[]): GameEvent[] {
  return queue.filter(e => !e.resolved);
}

/** Remove expired events (past expiresOnDay). Returns new array. */
export function removeExpired(queue: GameEvent[], currentDay: number): GameEvent[] {
  return queue.filter(e => e.expiresOnDay > currentDay);
}

/** Get all unresolved events of a specific priority. */
export function getByPriority(queue: GameEvent[], priority: EventPriority): GameEvent[] {
  return queue.filter(e => !e.resolved && e.priority === priority);
}

/** Get the next unresolved event (highest priority, oldest). Returns null if empty. */
export function peekNext(queue: GameEvent[]): GameEvent | null {
  const sorted = sortByPriority(queue.filter(e => !e.resolved));
  return sorted.length > 0 ? sorted[0] : null;
}

/** Process day: remove expired, sort remaining. Returns cleaned queue. */
export function advanceDay(queue: GameEvent[], currentDay: number): GameEvent[] {
  const active = removeExpired(
    dequeueResolved(queue),
    currentDay
  );
  return sortByPriority(active);
}
