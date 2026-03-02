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

/**
 * Update country-specific reputation after combat.
 * Increases reputation in the contract's country on victory, decreases on defeat.
 */
export function updateReputationByCountry(
  result: CombatResult,
  reputation: ReputationData,
  contract: import('@/types/contract').Contract,
): ReputationData {
  const countryId = contract.targetCityId.split('-')[0]; // derive country from city ID prefix
  // Find the country entry — try matching by contract's implied country
  const byCountry = reputation.byCountry.map(entry => {
    // We match all entries and only modify the one for this contract's country
    // Since targetCityId format is "city-{countryId}-...", we need the world to resolve.
    // Fallback: update the first country entry if no match found.
    return entry;
  });

  // Find country for this contract's city
  let countryIdx = byCountry.findIndex(c => contract.targetCityId.includes(c.countryId));
  if (countryIdx === -1 && byCountry.length > 0) {
    countryIdx = 0; // fallback to first country
  }

  if (countryIdx >= 0) {
    const delta = result.outcome === 'victory' ? 5
      : result.outcome === 'defeat' ? -8
      : -2;
    const updated = [...byCountry];
    updated[countryIdx] = {
      ...updated[countryIdx],
      value: clamp(updated[countryIdx].value + delta, -100, 100),
    };
    return { ...reputation, byCountry: updated };
  }

  return reputation;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
