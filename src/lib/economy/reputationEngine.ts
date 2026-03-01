// Iron Contract — Reputation Engine (GDD v2.0, pure, deterministic)
// Updates reputation post-combat and calculates reward multiplier.

import type { CombatResult } from '@/types/combat';
import type { ReputationData } from '@/types/reputation';

/**
 * Update reputation after a combat result.
 * Pure function — same input, same output.
 *
 * Rules:
 * - Victory increases professional, defeat decreases it
 * - Casualties reduce professional regardless of outcome
 * - High momentum victory boosts notoriety
 * - Catastrophic defeat increases notoriety (infamy)
 */
export function updateReputation(
  result: CombatResult,
  current: ReputationData
): ReputationData {
  let profDelta = 0;
  let notDelta = 0;

  // Outcome base
  if (result.outcome === 'victory') {
    profDelta += 5;
    if (result.momentumFinal > 60) {
      profDelta += 5;     // decisive victory bonus
      notDelta += 3;      // fame
    }
  } else if (result.outcome === 'defeat') {
    profDelta -= 8;
    if (result.momentumFinal < -60) {
      profDelta -= 5;     // catastrophic penalty
      notDelta += 5;      // infamy
    }
  } else {
    // retreat
    profDelta -= 2;
  }

  // Casualty penalty: each KIA = -2 professional
  profDelta -= result.playerCasualties.length * 2;

  // Clean operation bonus: victory with 0 casualties
  if (result.outcome === 'victory' && result.playerCasualties.length === 0) {
    profDelta += 3;
  }

  const professional = clamp(current.professional + profDelta, 0, 100);
  const notoriety = clamp(current.notoriety + notDelta, 0, 100);

  return {
    ...current,
    professional,
    notoriety,
    // ceoReputation and byCountry unchanged by combat alone
    ceoReputation: [...current.ceoReputation],
    byCountry: [...current.byCountry],
  };
}

/**
 * Calculate reputation-based reward multiplier.
 * Range: 0.80 (terrible rep) to 1.40 (stellar rep).
 * Linear interpolation: professional 0 → 0.80, 50 → 1.00, 100 → 1.40.
 */
export function calculateReputationBonus(reputation: ReputationData): number {
  const p = reputation.professional;
  // 0→0.80, 50→1.00, 100→1.40 (piecewise linear, steeper above 50)
  if (p <= 50) {
    return 0.80 + (p / 50) * 0.20;  // 0.80 to 1.00
  }
  return 1.00 + ((p - 50) / 50) * 0.40;  // 1.00 to 1.40
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
