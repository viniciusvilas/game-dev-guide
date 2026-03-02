// Iron Contract — Recruitment System (GDD v2.0, pure, deterministic)
// Generates recruit pools and handles hiring.

import type { Soldier } from '@/types/soldier';
import type { CompanyFinances, DailyTransaction } from '@/types/economy';
import { generateSoldier } from '@/lib/generators/soldierGenerator';
import { createRng } from '@/lib/generators/seededRandom';

/** Recruitment cost = soldier salary × 10 */
export function getRecruitmentCost(soldier: Soldier): number {
  return soldier.salary * 10;
}

/**
 * Generate a pool of available recruits for a given day.
 * Pool size: 3-5 soldiers. Deterministic via seed + day.
 */
export function generateRecruitPool(seed: number, day: number): Soldier[] {
  const rng = createRng(seed + day * 97);
  const poolSize = rng.nextInt(3, 5);
  const recruits: Soldier[] = [];

  for (let i = 0; i < poolSize; i++) {
    const soldierSeed = rng.nextInt(0, 2147483647);
    const quality = rng.nextInt(1, 4); // recruits are lower quality
    recruits.push(generateSoldier(soldierSeed, quality));
  }

  return recruits;
}

export interface HireResult {
  soldier: Soldier;
  transaction: DailyTransaction;
  newBalance: number;
}

/**
 * Hire a recruit. Returns updated soldier (status=available) and transaction.
 * Returns null if insufficient funds.
 */
export function hireRecruit(
  soldier: Soldier,
  currentBalance: number,
  day: number,
): HireResult | null {
  const cost = getRecruitmentCost(soldier);
  if (currentBalance < cost) return null;

  const hiredSoldier: Soldier = {
    ...soldier,
    status: 'available',
    daysInService: 0,
  };

  const transaction: DailyTransaction = {
    id: `tx-recruit-${soldier.id}-d${day}`,
    day,
    type: 'recruitment',
    amount: -cost,
    description: `Recrutamento: ${soldier.name}`,
    relatedEntityId: soldier.id,
  };

  return {
    soldier: hiredSoldier,
    transaction,
    newBalance: currentBalance - cost,
  };
}
