// Iron Contract — Contract Rewards (GDD v2.0, pure, deterministic)
// Calculates post-mission financial rewards.

import type { Contract, ContractResultOutcome } from '@/types/contract';
import type { ReputationData } from '@/types/reputation';
import type { DailyTransaction } from '@/types/economy';
import { calculateReputationBonus } from './reputationEngine';

/**
 * Outcome multiplier: victory=1.0, defeat=0.0 (penalty), retreat=0.3.
 */
function getOutcomeMultiplier(outcome: ContractResultOutcome): number {
  switch (outcome) {
    case 'victory': return 1.0;
    case 'retreat': return 0.3;
    case 'defeat': return 0.0;
  }
}

/**
 * Danger level bonus: higher danger = higher payout on success.
 * dangerLevel 1→1.0, 5→1.25, 10→1.50
 */
function getDangerBonus(dangerLevel: number): number {
  return 1.0 + (dangerLevel - 1) * (0.50 / 9);
}

/**
 * Calculate the total reward for a completed contract.
 * Pure function — same inputs, same output.
 *
 * reward = contract.reward * outcomeMult * dangerBonus * reputationBonus
 * On defeat: player pays contract.penalty instead.
 */
export function calculateContractReward(
  contract: Contract,
  outcome: ContractResultOutcome,
  reputation: ReputationData
): { netAmount: number; reputationMultiplier: number; dangerBonus: number } {
  const repMult = calculateReputationBonus(reputation);
  const dangerBonus = getDangerBonus(contract.dangerLevel);
  const outcomeMult = getOutcomeMultiplier(outcome);

  if (outcome === 'defeat') {
    return {
      netAmount: -contract.penalty,
      reputationMultiplier: repMult,
      dangerBonus,
    };
  }

  const netAmount = Math.round(contract.reward * outcomeMult * dangerBonus * repMult);

  return { netAmount, reputationMultiplier: repMult, dangerBonus };
}

/**
 * Create the transaction record for a contract reward/penalty.
 */
export function createRewardTransaction(
  contract: Contract,
  outcome: ContractResultOutcome,
  reputation: ReputationData,
  day: number,
  txIdSuffix: number
): DailyTransaction {
  const { netAmount } = calculateContractReward(contract, outcome, reputation);

  return {
    id: `tx-reward-${contract.id}-${txIdSuffix}`,
    day,
    type: netAmount >= 0 ? 'contract_reward' : 'penalty',
    amount: netAmount,
    description: netAmount >= 0
      ? `Recompensa: ${contract.title}`
      : `Penalidade: ${contract.title}`,
    relatedEntityId: contract.id,
  };
}
