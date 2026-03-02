// Iron Contract — Mission Types (GDD v2.0)

import type { CombatResult } from './combat';
import type { Rank, WeaponMastery } from './soldier';
import type { DailyTransaction } from './economy';
import type { GameEvent } from './events';

/** Consolidated result of a completed mission */
export interface MissionResult {
  contractId: string;
  combatResult: CombatResult;
  xpGained: Record<string, number>;              // soldierId → xp
  rankUps: Record<string, Rank>;                  // soldierId → new rank
  masteryGains: Record<string, WeaponMastery[]>;  // soldierId → gains
  transactions: DailyTransaction[];
  eventsGenerated: GameEvent[];
}

/** Validation error for a specific soldier */
export interface SoldierValidationError {
  soldierId: string;
  soldierName: string;
  errors: string[];
}

/** Result of mission validation */
export interface MissionValidationResult {
  valid: boolean;
  errors: string[];                          // global errors
  soldierErrors: SoldierValidationError[];   // per-soldier errors
}
