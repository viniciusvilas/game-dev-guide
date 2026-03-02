// Iron Contract — XP Engine (GDD v2.0, pure, deterministic)
// Calculates individual XP per soldier based on combat results.

import type { SoldierCombatResult, DamageState } from '@/types/combat';
import type { Contract } from '@/types/contract';

// === XP Configuration ===

const BASE_XP = 25;
const DANGER_XP_MULTIPLIER = 5; // per danger level
const DAMAGE_XP_DIVISOR = 50;   // +1 XP per 50 damage dealt

/** XP multiplier by damage state */
const STATE_MULTIPLIERS: Record<DamageState, number> = {
  healthy: 1.0,
  light_wound: 1.2,    // survival bonus
  heavy_wound: 1.3,    // survival bonus
  critical: 0.6,       // reduced XP
  dead: 0.0,           // no XP
};

// === Public API ===

/** Calculate XP earned by a single soldier after a mission */
export function calculateSoldierXP(
  soldierResult: SoldierCombatResult,
  contract: Contract,
): number {
  // Dead soldiers earn nothing
  if (soldierResult.damageState === 'dead') return 0;

  // Base XP scaled by contract danger
  const dangerBonus = contract.dangerLevel * DANGER_XP_MULTIPLIER;
  const baseXP = BASE_XP + dangerBonus;

  // State multiplier (survival bonus or critical penalty)
  const stateMultiplier = STATE_MULTIPLIERS[soldierResult.damageState];

  // Damage contribution bonus
  const damageBonus = Math.floor(soldierResult.damageDealt / DAMAGE_XP_DIVISOR);

  const totalXP = Math.floor(baseXP * stateMultiplier) + damageBonus;

  return Math.max(0, totalXP);
}

/** Apply XP to a soldier, returning updated soldier with new xp total */
export function applySoldierXP<T extends { xp: number }>(
  soldier: T,
  xpGained: number,
): T {
  return { ...soldier, xp: soldier.xp + xpGained };
}
