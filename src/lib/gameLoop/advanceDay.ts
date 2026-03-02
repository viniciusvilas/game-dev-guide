// Iron Contract — Day Advance Pipeline (GDD v2.0, pure, deterministic)
// Each subfunc is exported and testable independently.

import type { GameState } from '@/types/game';
import { processDailyTick, applyTransactions } from '@/lib/economy/financeEngine';
import { generateDailyRandomEvents } from '@/lib/events/eventGenerator';
import {
  checkSoldierTriggers,
  checkFinanceTriggers,
  checkReputationTriggers,
  checkFactionTriggers,
} from '@/lib/events/eventTriggers';
import { processEvent } from '@/lib/events/eventProcessor';
import { enqueueEvents, advanceDay as advanceEventQueue } from '@/lib/events/eventQueue';

// === Step 1: Finance Tick ===

/** Process daily financial costs: salaries, maintenance, medical */
export function processFinanceTick(state: GameState): GameState {
  const injuredCount = state.soldiers.filter(
    s => s.status === 'injured' || s.status === 'severely_injured' || s.status === 'unconscious'
  ).length;

  const transactions = processDailyTick({
    soldiers: state.soldiers,
    weaponCount: state.weapons.length,
    armorCount: state.armors.length,
    injuredCount,
    day: state.currentDay,
  });

  const updatedFinances = applyTransactions(state.finances, transactions, state.currentDay);

  return { ...state, finances: updatedFinances };
}

// === Step 2: Generate & Queue Events ===

/** Generate random events + conditional triggers, add to queue */
export function generateAndQueueEvents(state: GameState): GameState {
  // Random events
  const randomEvents = generateDailyRandomEvents(state.seed, state.currentDay);

  // Conditional triggers
  const soldierEvents = checkSoldierTriggers(state.soldiers, state.currentDay, state.events);
  const financeEvents = checkFinanceTriggers(state.finances, state.currentDay, state.events);
  const repEvents = checkReputationTriggers(state.reputation, state.currentDay, state.events);
  const factionEvents = checkFactionTriggers(state.factions, state.currentDay, state.events);

  const allNewEvents = [
    ...randomEvents,
    ...soldierEvents,
    ...financeEvents,
    ...repEvents,
    ...factionEvents,
  ];

  const updatedQueue = enqueueEvents(state.events, allNewEvents);

  return { ...state, events: updatedQueue };
}

// === Step 3: Resolve Event Queue ===

/** Process all critical events automatically */
export function resolveEventQueue(state: GameState): GameState {
  let soldiers = state.soldiers;
  let finances = state.finances;
  let reputation = state.reputation;
  let factions = state.factions;
  let events = [...state.events];

  // Auto-resolve critical events
  for (let i = 0; i < events.length; i++) {
    const evt = events[i];
    if (evt.resolved || evt.priority !== 'critical') continue;

    const result = processEvent(evt, soldiers, finances, reputation, factions);
    soldiers = result.soldiers;
    finances = result.finances;
    reputation = result.reputation;
    factions = result.factions;
    events[i] = result.event;
  }

  return { ...state, soldiers, finances, reputation, factions, events };
}

// === Step 4: Advance World Day ===

/** Increment day, clean event queue, update world */
export function advanceWorldDay(state: GameState): GameState {
  const nextDay = state.currentDay + 1;
  const cleanedQueue = advanceEventQueue(state.events, nextDay);

  // Update soldier days in service
  const updatedSoldiers = state.soldiers.map(s =>
    s.status !== 'dead' && s.status !== 'deserted'
      ? { ...s, daysInService: s.daysInService + 1 }
      : s
  );

  // Toggle time of day
  const timeOfDay = state.world.timeOfDay === 'day' ? 'night' as const : 'day' as const;

  return {
    ...state,
    currentDay: nextDay,
    soldiers: updatedSoldiers,
    events: cleanedQueue,
    world: { ...state.world, timeOfDay },
  };
}

// === Main Pipeline ===

/**
 * Advance the game by one day.
 * Pure pipeline: finance → events → resolve → advance.
 */
export function advanceDay(state: GameState): GameState {
  let s = state;
  s = processFinanceTick(s);
  s = generateAndQueueEvents(s);
  s = resolveEventQueue(s);
  s = advanceWorldDay(s);
  return s;
}
