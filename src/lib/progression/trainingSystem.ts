// Iron Contract — Training System (GDD v2.0, pure, deterministic)
// Handles attribute training during downtime.

import type { SoldierAttributes } from '@/types/soldier';
import type { DailyTransaction } from '@/types/economy';

// === Training Types ===

export interface TrainingSession {
  soldierId: string;
  attribute: keyof SoldierAttributes;
  durationDays: number;
  costPerDay: number;
}

export interface TrainingResult {
  soldierId: string;
  attributeGained: keyof SoldierAttributes;
  pointsGained: number;
  totalCost: number;
}

// === Cost Per Attribute ===

const ATTRIBUTE_COST: Record<keyof SoldierAttributes, number> = {
  combat: 80,
  surveillance: 50,
  stealth: 60,
  driving: 40,
  medicine: 70,
  logistics: 30,
};

// === Training Gain Logic ===

/** Points gained per day of training (1-3), with diminishing returns above 60 */
export function calculateDailyGain(currentLevel: number): number {
  if (currentLevel >= 95) return 0; // cap
  if (currentLevel >= 80) return 1;
  if (currentLevel >= 60) return 2; // diminishing returns
  return 3;
}

/** Create a training session with correct cost per day */
export function createTrainingSession(
  soldierId: string,
  attribute: keyof SoldierAttributes,
  durationDays: number,
): TrainingSession {
  return {
    soldierId,
    attribute,
    durationDays,
    costPerDay: ATTRIBUTE_COST[attribute],
  };
}

/** Process a training session and return the result */
export function processTraining(
  session: TrainingSession,
  currentAttributes: SoldierAttributes,
): TrainingResult {
  let currentLevel = currentAttributes[session.attribute];
  let totalGain = 0;
  let daysActuallyTrained = 0;

  for (let d = 0; d < session.durationDays; d++) {
    const gain = calculateDailyGain(currentLevel);
    if (gain === 0) break; // cap reached — stop early, don't charge remaining days
    totalGain += gain;
    daysActuallyTrained++;
    currentLevel = Math.min(100, currentLevel + gain);
  }

  return {
    soldierId: session.soldierId,
    attributeGained: session.attribute,
    pointsGained: totalGain,
    totalCost: daysActuallyTrained * session.costPerDay,
  };
}

/** Apply training result to soldier attributes */
export function applyTrainingResult(
  attributes: SoldierAttributes,
  result: TrainingResult,
): SoldierAttributes {
  return {
    ...attributes,
    [result.attributeGained]: Math.min(
      100,
      attributes[result.attributeGained] + result.pointsGained,
    ),
  };
}

/** Generate a DailyTransaction for a training session */
export function trainingToTransaction(
  result: TrainingResult,
  day: number,
): DailyTransaction {
  return {
    id: `tx-training-${result.soldierId}-d${day}`,
    day,
    type: 'training',
    amount: -result.totalCost,
    description: `Treinamento de ${result.attributeGained} para soldado ${result.soldierId}`,
    relatedEntityId: result.soldierId,
  };
}
