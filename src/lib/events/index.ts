// Iron Contract — Events Module (public API)

export { generateDailyRandomEvents } from './eventGenerator';
export {
  checkSoldierTriggers,
  checkFinanceTriggers,
  checkReputationTriggers,
  checkFactionTriggers,
} from './eventTriggers';
export {
  applyEffectsToSoldiers,
  applyEffectsToFinances,
  applyEffectsToReputation,
  applyEffectsToFactions,
  processEvent,
} from './eventProcessor';
export type { EventProcessResult } from './eventProcessor';
export {
  sortByPriority,
  enqueueEvents,
  dequeueResolved,
  removeExpired,
  getByPriority,
  peekNext,
  advanceDay,
} from './eventQueue';
