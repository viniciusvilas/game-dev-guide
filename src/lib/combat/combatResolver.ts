// Iron Contract — Combat Resolver (GDD v2.0, pure, deterministic)
// Survival Score, damage states, equipment degradation

import type { SeededRng } from '@/lib/generators/seededRandom';
import type {
  SoldierCombatInput,
  SoldierCombatResult,
  DamageState,
  CombatPhaseResult,
} from '@/types/combat';
import { calculateEffectiveHP } from './damageModel';

// === Survival Score ===

/**
 * Calculate a soldier's survival score (0-100).
 * Higher = more likely to survive. Based on combat, armor, rank and stress.
 */
export function calculateSurvivalScore(soldier: SoldierCombatInput): number {
  const armorBonus = soldier.armorNivel * 5;        // 0-20
  const combatBonus = soldier.combat * 0.3;          // 0-30
  const stressPenalty = soldier.stress * 0.2;        // 0-20
  const moralBonus = soldier.morale * 0.15;          // 0-15
  const rankBonus = RANK_SURVIVAL[soldier.rank] ?? 0; // 0-15

  return Math.min(100, Math.max(0,
    50 + armorBonus + combatBonus - stressPenalty + moralBonus + rankBonus - 50
  ));
}

const RANK_SURVIVAL: Record<string, number> = {
  recruit: 0,
  operator: 2,
  corporal: 4,
  sergeant: 6,
  sergeant_major: 8,
  lieutenant: 10,
  captain: 12,
  major: 15,
};

// === Damage State Assignment ===

/**
 * Determine damage state for a soldier based on damage taken vs effective HP.
 * Uses survival score + RNG for individual variance.
 */
export function determineDamageState(
  rng: SeededRng,
  soldier: SoldierCombatInput,
  totalDamagePool: number,
  nSoldiers: number
): { state: DamageState; damageTaken: number } {
  const hp = calculateEffectiveHP(soldier.mtVest);
  const survivalScore = calculateSurvivalScore(soldier);

  // Distribute damage pool across soldiers (inversely proportional to survival)
  // Soldiers with lower survival scores absorb more damage
  const survivalWeight = (100 - survivalScore) / 100;
  const baseDamageShare = totalDamagePool / nSoldiers;
  const individualDamage = baseDamageShare * (0.5 + survivalWeight) * rng.nextFloat(0.6, 1.4);

  const damageRatio = individualDamage / hp;

  let state: DamageState;
  if (damageRatio < 0.15) {
    state = 'healthy';
  } else if (damageRatio < 0.35) {
    state = 'light_wound';
  } else if (damageRatio < 0.60) {
    state = 'heavy_wound';
  } else if (damageRatio < 0.90) {
    state = 'critical';
  } else {
    state = 'dead';
  }

  // Survival score gives a chance to downgrade damage
  if (state !== 'healthy' && rng.chance(survivalScore / 200)) {
    state = downgradeDamage(state);
  }

  return { state, damageTaken: Math.round(individualDamage) };
}

function downgradeDamage(state: DamageState): DamageState {
  switch (state) {
    case 'dead': return 'critical';
    case 'critical': return 'heavy_wound';
    case 'heavy_wound': return 'light_wound';
    case 'light_wound': return 'healthy';
    default: return state;
  }
}

// === Equipment Degradation ===

/**
 * Calculate equipment condition loss based on combat intensity.
 * Returns percentage points of condition lost.
 */
export function calculateEquipmentDegradation(
  rng: SeededRng,
  phases: CombatPhaseResult[]
): { weaponLoss: number; armorLoss: number } {
  const totalDamageDealt = phases.reduce((sum, p) => sum + p.playerDamageDealt, 0);
  const totalDamageTaken = phases.reduce((sum, p) => sum + p.playerDamageTaken, 0);

  // Weapon degrades with use (damage dealt), armor with hits taken
  const weaponLoss = Math.min(25, (totalDamageDealt / 500) * rng.nextFloat(2, 8));
  const armorLoss = Math.min(30, (totalDamageTaken / 300) * rng.nextFloat(3, 10));

  return {
    weaponLoss: Math.round(weaponLoss * 10) / 10,
    armorLoss: Math.round(armorLoss * 10) / 10,
  };
}

// === Resolve All Soldier Outcomes ===

/**
 * Determine individual outcomes for each soldier after combat.
 * Pure and deterministic with given RNG.
 */
export function resolveSoldierOutcomes(
  rng: SeededRng,
  soldiers: SoldierCombatInput[],
  phases: CombatPhaseResult[],
  isVictory: boolean
): SoldierCombatResult[] {
  const totalDamageTaken = phases.reduce((sum, p) => sum + p.playerDamageTaken, 0);
  const totalDamageDealt = phases.reduce((sum, p) => sum + p.playerDamageDealt, 0);

  // Victory reduces damage taken effect by 30%
  const effectiveDamagePool = isVictory ? totalDamageTaken * 0.7 : totalDamageTaken;

  const degradation = calculateEquipmentDegradation(rng, phases);

  return soldiers.map(soldier => {
    const { state, damageTaken } = determineDamageState(
      rng, soldier, effectiveDamagePool, soldiers.length
    );

    // Individual damage dealt proportional to DPS contribution
    const individualDamage = totalDamageDealt / soldiers.length * rng.nextFloat(0.7, 1.3);

    return {
      soldierId: soldier.soldierId,
      damageState: state,
      damageDealt: Math.round(individualDamage),
      damageTaken,
      survivalScore: calculateSurvivalScore(soldier),
      weaponConditionLoss: degradation.weaponLoss * rng.nextFloat(0.8, 1.2),
      armorConditionLoss: degradation.armorLoss * rng.nextFloat(0.8, 1.2),
    };
  });
}
