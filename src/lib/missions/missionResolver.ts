// Iron Contract — Mission Resolver (GDD v2.0, pure, deterministic)
// Resolves per-soldier outcomes after combat: status changes, stress/morale adjustments.

import type { Soldier, SoldierStatus } from '@/types/soldier';
import type { SoldierCombatResult, DamageState } from '@/types/combat';

/** Map DamageState to SoldierStatus */
function damageStateToStatus(state: DamageState): SoldierStatus {
  switch (state) {
    case 'healthy': return 'available';
    case 'light_wound': return 'injured';
    case 'heavy_wound': return 'severely_injured';
    case 'critical': return 'unconscious';
    case 'dead': return 'dead';
  }
}

/** Stress delta by damage state */
function getStressDelta(state: DamageState, isVictory: boolean): number {
  const base = (() => {
    switch (state) {
      case 'healthy': return 5;
      case 'light_wound': return 10;
      case 'heavy_wound': return 20;
      case 'critical': return 30;
      case 'dead': return 0;
    }
  })();
  // Victory reduces stress impact
  return isVictory ? Math.floor(base * 0.6) : base;
}

/** Morale delta by outcome */
function getMoraleDelta(state: DamageState, isVictory: boolean): number {
  if (state === 'dead') return 0;
  if (isVictory) {
    return state === 'healthy' ? 10 : 5;
  }
  // Defeat
  return state === 'healthy' ? -10 : -15;
}

export interface ResolvedSoldier {
  soldier: Soldier;
  previousStatus: SoldierStatus;
}

/**
 * Resolve post-combat state for all soldiers.
 * Returns new soldier objects with updated status, stress, morale, missionsCompleted.
 */
export function resolveSoldierOutcomesPost(
  soldiers: Soldier[],
  combatResults: SoldierCombatResult[],
  isVictory: boolean,
): ResolvedSoldier[] {
  return soldiers.map(s => {
    const result = combatResults.find(r => r.soldierId === s.id);
    if (!result) {
      // Soldier wasn't in combat — no changes
      return { soldier: s, previousStatus: s.status };
    }

    const newStatus = damageStateToStatus(result.damageState);
    const stressDelta = getStressDelta(result.damageState, isVictory);
    const moraleDelta = getMoraleDelta(result.damageState, isVictory);

    const updated: Soldier = {
      ...s,
      status: newStatus,
      stress: clamp(s.stress + stressDelta, 0, 100),
      morale: clamp(s.morale + moraleDelta, 0, 100),
      missionsCompleted: result.damageState !== 'dead'
        ? s.missionsCompleted + 1
        : s.missionsCompleted,
    };

    return { soldier: updated, previousStatus: s.status };
  });
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
