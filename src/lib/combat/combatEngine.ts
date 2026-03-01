// Iron Contract — Combat Engine Orchestrator (GDD v2.0, pure, deterministic)

import type { SeededRng } from '@/lib/generators/seededRandom';
import type {
  SoldierCombatInput,
  FactionCombatInput,
  MissionCombatContext,
  CombatResult,
} from '@/types/combat';
import { createRng } from '@/lib/generators/seededRandom';
import { resolveMomentum } from './momentumEngine';
import { resolveTTKRace, blendResults } from './ttkRace';
import { resolveSoldierOutcomes } from './combatResolver';
import { generateNarrative } from './narrativeGenerator';
import { calculateFactionHP } from './damageModel';

/**
 * Main combat resolution function.
 * Runs Momentum 3-Phase + TTK Race, blends results,
 * resolves individual soldier outcomes, and generates narrative.
 *
 * Pure and deterministic — same seed, same result.
 */
export function resolveCombat(
  seed: number,
  contractId: string,
  soldiers: SoldierCombatInput[],
  faction: FactionCombatInput,
  context: MissionCombatContext
): CombatResult {
  const rng = createRng(seed);
  const n = soldiers.length;

  // 1. Momentum 3 Phases
  const momentumResult = resolveMomentum(rng, soldiers, faction, context);

  // 2. TTK Race
  const ttkResult = resolveTTKRace(soldiers, faction, context);

  // 3. Blend results (W_TTK grows with squad size)
  const blended = blendResults(momentumResult, ttkResult, n);

  // 4. Resolve individual soldier outcomes
  const isVictory = blended.outcome === 'victory';
  const soldierResults = resolveSoldierOutcomes(rng, soldiers, blended.phases, isVictory);

  // 5. Categorize casualties and injured
  const playerCasualties = soldierResults
    .filter(r => r.damageState === 'dead')
    .map(r => r.soldierId);

  const playerInjured = soldierResults
    .filter(r => r.damageState === 'light_wound' || r.damageState === 'heavy_wound' || r.damageState === 'critical')
    .map(r => r.soldierId);

  // 6. Estimate enemy casualties based on total damage dealt
  const totalDamageDealt = blended.phases.reduce((sum, p) => sum + p.playerDamageDealt, 0);
  const factionTotalHP = calculateFactionHP(faction);
  const enemyCasualtiesEstimate = Math.round(
    (totalDamageDealt / Math.max(factionTotalHP, 1)) * faction.troops
  );

  // 7. Build result
  const result: CombatResult = {
    contractId,
    phases: blended.phases,
    outcome: blended.outcome,
    soldierResults,
    playerCasualties,
    playerInjured,
    enemyCasualtiesEstimate: Math.min(enemyCasualtiesEstimate, faction.troops),
    momentumFinal: blended.blendedMomentum,
    narrative: '', // filled below
  };

  // 8. Generate narrative
  result.narrative = generateNarrative(result);

  return result;
}
