// Iron Contract — Mission Applicator (GDD v2.0, pure, deterministic)
// Applies all post-mission effects to GameState in a single pass.

import type { GameState } from '@/types/game';
import type { MissionResult } from '@/types/mission';
import type { Soldier } from '@/types/soldier';
import { resolveSoldierOutcomesPost } from './missionResolver';
import { applySoldierXP } from '@/lib/progression/xpEngine';
import { applyMasteryGain, getMasteryLevel } from '@/lib/progression/weaponMasterySystem';
import { updateReputation } from '@/lib/economy/reputationEngine';

/**
 * Apply all effects from a MissionResult to a GameState.
 * Returns a new GameState — pure, no mutations.
 */
export function applyMissionResult(
  result: MissionResult,
  state: GameState,
): GameState {
  const isVictory = result.combatResult.outcome === 'victory';

  // 1. Resolve soldier statuses (stress, morale, status changes)
  const missionSoldiers = state.soldiers.filter(s =>
    result.combatResult.soldierResults.some(r => r.soldierId === s.id)
  );
  const resolved = resolveSoldierOutcomesPost(
    missionSoldiers,
    result.combatResult.soldierResults,
    isVictory,
  );

  // 2. Apply XP, rank ups, and mastery gains
  let updatedSoldiers = state.soldiers.map(s => {
    const resolvedEntry = resolved.find(r => r.soldier.id === s.id);
    let soldier = resolvedEntry ? resolvedEntry.soldier : s;

    // Apply XP
    const xp = result.xpGained[soldier.id];
    if (xp !== undefined && xp > 0) {
      soldier = applySoldierXP(soldier, xp);
    }

    // Apply rank up
    const newRank = result.rankUps[soldier.id];
    if (newRank) {
      soldier = { ...soldier, rank: newRank };
    }

    // Apply mastery gains
    const masteryList = result.masteryGains[soldier.id];
    if (masteryList) {
      for (const m of masteryList) {
        const currentLevel = getMasteryLevel(soldier, m.category);
        const gain = m.level - currentLevel;
        if (gain > 0) {
          soldier = applyMasteryGain(soldier, m.category, gain);
        }
      }
    }

    return soldier;
  });

  // 3. Apply equipment degradation
  const weaponResults = new Map<string, number>();
  const armorResults = new Map<string, number>();
  for (const sr of result.combatResult.soldierResults) {
    const soldier = state.soldiers.find(s => s.id === sr.soldierId);
    if (!soldier) continue;
    if (soldier.equippedWeaponId) {
      const prev = weaponResults.get(soldier.equippedWeaponId) || 0;
      weaponResults.set(soldier.equippedWeaponId, prev + sr.weaponConditionLoss);
    }
    if (soldier.equippedArmorId) {
      const prev = armorResults.get(soldier.equippedArmorId) || 0;
      armorResults.set(soldier.equippedArmorId, prev + sr.armorConditionLoss);
    }
  }

  const updatedWeapons = state.weapons.map(w => {
    const loss = weaponResults.get(w.id);
    if (!loss) return w;
    return { ...w, conditionPercent: Math.max(0, w.conditionPercent - loss) };
  });

  const updatedArmors = state.armors.map(a => {
    const loss = armorResults.get(a.id);
    if (!loss) return a;
    return { ...a, conditionPercent: Math.max(0, a.conditionPercent - loss) };
  });

  // 4. Update reputation
  const updatedReputation = updateReputation(result.combatResult, state.reputation);

  // 5. Apply financial transactions to balance
  const totalAmount = result.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const updatedFinances = {
    ...state.finances,
    transactions: [...state.finances.transactions, ...result.transactions],
  };

  // 6. Add generated events
  const updatedEvents = [...state.events, ...result.eventsGenerated];

  // 7. Update faction military power on casualties
  const updatedFactions = state.factions.map(f => {
    if (f.id !== result.combatResult.contractId) return f; // match by targetFactionId done upstream
    const casualtyRatio = result.combatResult.enemyCasualtiesEstimate / Math.max(f.troops, 1);
    const powerLoss = Math.round(casualtyRatio * 20);
    return {
      ...f,
      troops: Math.max(0, f.troops - result.combatResult.enemyCasualtiesEstimate),
      militaryPower: Math.max(0, f.militaryPower - powerLoss),
    };
  });

  return {
    ...state,
    soldiers: updatedSoldiers,
    weapons: updatedWeapons,
    armors: updatedArmors,
    reputation: updatedReputation,
    finances: updatedFinances,
    events: updatedEvents,
    factions: updatedFactions,
  };
}
