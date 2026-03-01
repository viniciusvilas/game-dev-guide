// Iron Contract — TTK Race (GDD v2.0, pure, deterministic)
// Time-To-Kill race model + blend with Momentum result

import type {
  SoldierCombatInput,
  FactionCombatInput,
  MissionCombatContext,
  MomentumResult,
  TTKResult,
  CombatPhaseResult,
} from '@/types/combat';
import {
  calculateSquadDPS,
  calculateEnemyDPSToSquad,
  calculateEffectiveHP,
  calculateFactionHP,
} from './damageModel';

// === TTK Race ===

/**
 * Resolve combat as a TTK (Time-To-Kill) race.
 * Compares how long each side takes to eliminate the other.
 * Pure and deterministic.
 */
export function resolveTTKRace(
  soldiers: SoldierCombatInput[],
  faction: FactionCombatInput,
  context: MissionCombatContext
): TTKResult {
  // Total player HP
  const totalPlayerHP = soldiers.reduce(
    (sum, s) => sum + calculateEffectiveHP(s.mtVest),
    0
  );

  // Total faction HP
  const totalFactionHP = calculateFactionHP(faction);

  // DPS calculations
  const squadDPS = calculateSquadDPS(soldiers, context);
  const enemyDPS = calculateEnemyDPSToSquad(faction, context, context.shelter);

  // TTK = total enemy HP / our DPS (turns to eliminate enemy)
  const playerTTK = squadDPS > 0 ? totalFactionHP / squadDPS : Infinity;
  const enemyTTK = enemyDPS > 0 ? totalPlayerHP / enemyDPS : Infinity;

  // Ratio: < 1 means player kills faster (good)
  const ttkRatio = enemyTTK > 0 ? playerTTK / enemyTTK : 0;

  const outcome: TTKResult['outcome'] =
    ttkRatio < 0.8 ? 'victory' :
    ttkRatio > 1.3 ? 'defeat' :
    'retreat';

  return {
    playerTTK: Math.round(playerTTK * 100) / 100,
    enemyTTK: Math.round(enemyTTK * 100) / 100,
    ttkRatio: Math.round(ttkRatio * 1000) / 1000,
    outcome,
  };
}

// === Blend ===

/**
 * Blend Momentum result with TTK Race result.
 * W_TTK = (n - 14) / 36 where n = number of soldiers.
 * For n ≤ 14: pure Momentum. For n ≥ 50: pure TTK.
 * Between 14-50: gradual blend.
 */
export function blendResults(
  momentumResult: MomentumResult,
  ttkResult: TTKResult,
  nSoldiers: number
): {
  outcome: 'victory' | 'defeat' | 'retreat';
  blendedMomentum: number;
  wTTK: number;
  phases: CombatPhaseResult[];
} {
  // W_TTK weight: 0 at n=14, 1 at n=50
  const wTTK = Math.max(0, Math.min(1, (nSoldiers - 14) / 36));
  const wMomentum = 1 - wTTK;

  // Convert TTK outcome to a momentum-like score
  const ttkMomentumEquivalent =
    ttkResult.outcome === 'victory' ? 60 :
    ttkResult.outcome === 'defeat' ? -60 :
    0;

  // Blend the momentum values
  const blendedMomentum = Math.round(
    (momentumResult.finalMomentum * wMomentum + ttkMomentumEquivalent * wTTK) * 10
  ) / 10;

  // Determine final outcome from blended momentum
  const outcome: 'victory' | 'defeat' | 'retreat' =
    blendedMomentum > 20 ? 'victory' :
    blendedMomentum < -20 ? 'defeat' :
    'retreat';

  return {
    outcome,
    blendedMomentum,
    wTTK: Math.round(wTTK * 1000) / 1000,
    phases: momentumResult.phases,
  };
}
