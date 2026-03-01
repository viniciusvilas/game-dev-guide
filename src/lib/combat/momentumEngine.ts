// Iron Contract — Momentum Engine 3 Fases (GDD v2.0, pure, deterministic)

import type { SeededRng } from '@/lib/generators/seededRandom';
import type {
  SoldierCombatInput,
  FactionCombatInput,
  MissionCombatContext,
  CombatPhaseResult,
  MomentumResult,
} from '@/types/combat';
import {
  calculateSquadDPS,
  calculateEnemyDPSToSquad,
  calculateFactionHP,
  calculateEffectiveHP,
  getApproachModifier,
} from './damageModel';

// === Phase 1: Engagement ===

/**
 * Engagement phase — first contact.
 * Stealth approach grants surprise bonus; intel affects initial momentum.
 */
export function resolvePhase1(
  rng: SeededRng,
  soldiers: SoldierCombatInput[],
  faction: FactionCombatInput,
  context: MissionCombatContext
): CombatPhaseResult {
  const squadDPS = calculateSquadDPS(soldiers, context);
  const enemyDPS = calculateEnemyDPSToSquad(faction, context, context.shelter);
  const approachMod = getApproachModifier(context.approach);

  // Surprise factor from stealth
  const stealthAvg = soldiers.reduce((sum, s) => sum + s.stealth, 0) / soldiers.length;
  const surpriseBonus = approachMod.stealthBonus * (stealthAvg / 100);

  // Phase 1 is shorter — 20% of total engagement
  const phaseDuration = 0.2;
  const playerDamage = squadDPS * phaseDuration * (1 + surpriseBonus);
  const enemyDamage = enemyDPS * phaseDuration * (1 - surpriseBonus * 0.5);

  // Momentum: positive = player advantage
  const dpsRatio = squadDPS / Math.max(enemyDPS, 1);
  const momentumShift = (dpsRatio - 1) * 20 + surpriseBonus * 15 + rng.nextFloat(-5, 5);

  const events: string[] = [];
  if (surpriseBonus > 0.1) events.push('Surprise advantage on engagement');
  if (dpsRatio > 1.5) events.push('Overwhelming firepower in first contact');
  if (dpsRatio < 0.7) events.push('Enemy has superior firepower');

  return {
    phase: 'engagement',
    playerDamageDealt: Math.round(playerDamage),
    playerDamageTaken: Math.round(enemyDamage),
    momentumShift: Math.round(momentumShift * 10) / 10,
    events,
  };
}

// === Phase 2: Firefight ===

/**
 * Firefight phase — sustained combat.
 * Main damage phase; momentum from phase 1 affects performance.
 */
export function resolvePhase2(
  rng: SeededRng,
  soldiers: SoldierCombatInput[],
  faction: FactionCombatInput,
  context: MissionCombatContext,
  currentMomentum: number
): CombatPhaseResult {
  const squadDPS = calculateSquadDPS(soldiers, context);
  const enemyDPS = calculateEnemyDPSToSquad(faction, context, context.shelter);

  // Momentum modifier: current momentum affects both sides
  const momentumFactor = 1 + (currentMomentum / 200); // ±50% at extreme momentum
  const inverseMomentum = 1 - (currentMomentum / 200);

  // Phase 2 is longest — 50% of total engagement
  const phaseDuration = 0.5;
  const playerDamage = squadDPS * phaseDuration * momentumFactor;
  const enemyDamage = enemyDPS * phaseDuration * inverseMomentum;

  // Surveillance helps maintain DPS via better target acquisition
  const survAvg = soldiers.reduce((sum, s) => sum + s.surveillance, 0) / soldiers.length;
  const survBonus = (survAvg - 50) / 500; // ±10% at extremes

  const dpsRatio = (squadDPS * momentumFactor) / Math.max(enemyDPS * inverseMomentum, 1);
  const momentumShift = (dpsRatio - 1) * 15 + survBonus * 10 + rng.nextFloat(-8, 8);

  const events: string[] = [];
  if (momentumFactor > 1.2) events.push('Player momentum driving enemy back');
  if (inverseMomentum > 1.2) events.push('Enemy regaining ground');
  if (rng.chance(0.15)) events.push('Intense crossfire exchange');

  return {
    phase: 'firefight',
    playerDamageDealt: Math.round(playerDamage * (1 + survBonus)),
    playerDamageTaken: Math.round(enemyDamage),
    momentumShift: Math.round(momentumShift * 10) / 10,
    events,
  };
}

// === Phase 3: Resolution ===

/**
 * Resolution phase — final push or retreat.
 * Outcome heavily influenced by accumulated momentum.
 */
export function resolvePhase3(
  rng: SeededRng,
  soldiers: SoldierCombatInput[],
  faction: FactionCombatInput,
  context: MissionCombatContext,
  currentMomentum: number
): CombatPhaseResult {
  const squadDPS = calculateSquadDPS(soldiers, context);
  const enemyDPS = calculateEnemyDPSToSquad(faction, context, context.shelter);

  // Strong momentum = decisive resolution
  const momentumFactor = 1 + (currentMomentum / 150);
  const inverseMomentum = 1 - (currentMomentum / 150);

  // Phase 3 is shorter — 30% of total engagement
  const phaseDuration = 0.3;
  const playerDamage = squadDPS * phaseDuration * Math.max(momentumFactor, 0.3);
  const enemyDamage = enemyDPS * phaseDuration * Math.max(inverseMomentum, 0.3);

  const momentumShift = (currentMomentum > 0 ? 1 : -1) * Math.abs(currentMomentum) * 0.1 + rng.nextFloat(-3, 3);

  const events: string[] = [];
  if (currentMomentum > 40) events.push('Enemy forces breaking');
  if (currentMomentum < -40) events.push('Squad forced to fall back');
  if (Math.abs(currentMomentum) < 15) events.push('Stalemate — grinding attrition');

  return {
    phase: 'resolution',
    playerDamageDealt: Math.round(playerDamage),
    playerDamageTaken: Math.round(enemyDamage),
    momentumShift: Math.round(momentumShift * 10) / 10,
    events,
  };
}

// === Orchestrator ===

/**
 * Resolve all 3 momentum phases sequentially.
 * Pure and deterministic — same RNG state, same result.
 */
export function resolveMomentum(
  rng: SeededRng,
  soldiers: SoldierCombatInput[],
  faction: FactionCombatInput,
  context: MissionCombatContext
): MomentumResult {
  let momentum = 0;

  const phase1 = resolvePhase1(rng, soldiers, faction, context);
  momentum += phase1.momentumShift;
  momentum = clampMomentum(momentum);

  const phase2 = resolvePhase2(rng, soldiers, faction, context, momentum);
  momentum += phase2.momentumShift;
  momentum = clampMomentum(momentum);

  const phase3 = resolvePhase3(rng, soldiers, faction, context, momentum);
  momentum += phase3.momentumShift;
  momentum = clampMomentum(momentum);

  const outcome: MomentumResult['outcome'] =
    momentum > 20 ? 'victory' :
    momentum < -20 ? 'defeat' :
    'retreat';

  return {
    phases: [phase1, phase2, phase3],
    finalMomentum: Math.round(momentum * 10) / 10,
    outcome,
  };
}

function clampMomentum(m: number): number {
  return Math.max(-100, Math.min(100, m));
}
