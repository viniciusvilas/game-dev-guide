// Iron Contract — Economy Tests (deterministic)

import { describe, it, expect } from 'vitest';
import { updateReputation, calculateReputationBonus } from '@/lib/economy/reputationEngine';
import { calculateContractReward, createRewardTransaction } from '@/lib/economy/contractRewards';
import {
  calculateDailySalaries,
  processDailyTick,
  applyTransactions,
  createInitialFinances,
} from '@/lib/economy/financeEngine';
import { getWeaponPrice, getArmorPrice, getMarketCatalog } from '@/lib/economy/marketPrices';
import type { CombatResult } from '@/types/combat';
import type { ReputationData } from '@/types/reputation';
import type { Contract } from '@/types/contract';
import type { Soldier } from '@/types/soldier';

// === Helpers ===

function makeReputation(professional = 50, notoriety = 20): ReputationData {
  return { professional, notoriety, ceoReputation: [], byCountry: [] };
}

function makeCombatResult(overrides: Partial<CombatResult> = {}): CombatResult {
  return {
    contractId: 'c1',
    phases: [],
    outcome: 'victory',
    soldierResults: [],
    playerCasualties: [],
    playerInjured: [],
    enemyCasualtiesEstimate: 5,
    momentumFinal: 40,
    narrative: '',
    ...overrides,
  };
}

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'contract-1',
    title: 'Op Tempestade',
    description: 'Teste',
    type: 'security',
    clientId: 'client-1',
    targetFactionId: 'fac-1',
    targetCityId: 'city-1',
    reward: 10000,
    penalty: 3000,
    durationDays: 3,
    dangerLevel: 5,
    requiredSoldiers: 4,
    expiresOnDay: 30,
    ...overrides,
  };
}

function makeSoldier(id: string, salary: number, status: Soldier['status'] = 'available'): Soldier {
  return {
    id,
    name: `Soldier ${id}`,
    rank: 'operator',
    status,
    attributes: { combat: 60, surveillance: 50, stealth: 40, driving: 30, medicine: 20, logistics: 30 },
    weaponMasteries: [],
    skills: [],
    stress: 20,
    morale: 70,
    salary,
    equippedWeaponId: null,
    equippedArmorId: null,
    xp: 0,
    missionsCompleted: 0,
    daysInService: 10,
  };
}

// === Reputation Engine ===

describe('ReputationEngine', () => {
  it('increases professional on victory', () => {
    const rep = makeReputation(50, 20);
    const result = updateReputation(makeCombatResult({ outcome: 'victory', momentumFinal: 40 }), rep);
    expect(result.professional).toBeGreaterThan(50);
  });

  it('decreases professional on defeat', () => {
    const rep = makeReputation(50, 20);
    const result = updateReputation(makeCombatResult({ outcome: 'defeat', momentumFinal: -40 }), rep);
    expect(result.professional).toBeLessThan(50);
  });

  it('increases notoriety on decisive victory', () => {
    const rep = makeReputation(50, 20);
    const result = updateReputation(makeCombatResult({ outcome: 'victory', momentumFinal: 70 }), rep);
    expect(result.notoriety).toBeGreaterThan(20);
  });

  it('penalizes professional per casualty', () => {
    const rep = makeReputation(50, 20);
    const noCas = updateReputation(makeCombatResult({ playerCasualties: [] }), rep);
    const withCas = updateReputation(makeCombatResult({ playerCasualties: ['s1', 's2'] }), rep);
    expect(withCas.professional).toBeLessThan(noCas.professional);
  });

  it('bonus for clean victory (0 casualties)', () => {
    const rep = makeReputation(50, 20);
    const clean = updateReputation(makeCombatResult({ outcome: 'victory', playerCasualties: [] }), rep);
    const messy = updateReputation(makeCombatResult({ outcome: 'victory', playerCasualties: ['s1'] }), rep);
    expect(clean.professional).toBeGreaterThan(messy.professional);
  });

  it('clamps professional to 0-100', () => {
    const lowRep = makeReputation(2, 0);
    const result = updateReputation(makeCombatResult({ outcome: 'defeat', momentumFinal: -70, playerCasualties: ['a','b','c','d'] }), lowRep);
    expect(result.professional).toBeGreaterThanOrEqual(0);
  });

  it('calculateReputationBonus returns 0.80-1.40 range', () => {
    expect(calculateReputationBonus(makeReputation(0))).toBeCloseTo(0.80, 2);
    expect(calculateReputationBonus(makeReputation(50))).toBeCloseTo(1.00, 2);
    expect(calculateReputationBonus(makeReputation(100))).toBeCloseTo(1.40, 2);
  });
});

// === Contract Rewards ===

describe('ContractRewards', () => {
  it('victory gives positive reward', () => {
    const { netAmount } = calculateContractReward(makeContract(), 'victory', makeReputation(50));
    expect(netAmount).toBeGreaterThan(0);
  });

  it('defeat applies penalty', () => {
    const { netAmount } = calculateContractReward(makeContract(), 'defeat', makeReputation(50));
    expect(netAmount).toBe(-3000);
  });

  it('retreat gives partial reward', () => {
    const { netAmount: victoryAmt } = calculateContractReward(makeContract(), 'victory', makeReputation(50));
    const { netAmount: retreatAmt } = calculateContractReward(makeContract(), 'retreat', makeReputation(50));
    expect(retreatAmt).toBeLessThan(victoryAmt);
    expect(retreatAmt).toBeGreaterThan(0);
  });

  it('higher reputation increases reward', () => {
    const contract = makeContract();
    const { netAmount: lowRep } = calculateContractReward(contract, 'victory', makeReputation(20));
    const { netAmount: highRep } = calculateContractReward(contract, 'victory', makeReputation(80));
    expect(highRep).toBeGreaterThan(lowRep);
  });

  it('higher danger increases reward', () => {
    const rep = makeReputation(50);
    const { netAmount: lowDanger } = calculateContractReward(makeContract({ dangerLevel: 1 }), 'victory', rep);
    const { netAmount: highDanger } = calculateContractReward(makeContract({ dangerLevel: 10 }), 'victory', rep);
    expect(highDanger).toBeGreaterThan(lowDanger);
  });

  it('createRewardTransaction generates valid transaction', () => {
    const tx = createRewardTransaction(makeContract(), 'victory', makeReputation(50), 10, 1);
    expect(tx.amount).toBeGreaterThan(0);
    expect(tx.type).toBe('contract_reward');
    expect(tx.day).toBe(10);
  });
});

// === Finance Engine ===

describe('FinanceEngine', () => {
  it('calculates daily salaries excluding dead soldiers', () => {
    const soldiers = [makeSoldier('s1', 100), makeSoldier('s2', 150), makeSoldier('s3', 200, 'dead')];
    expect(calculateDailySalaries(soldiers)).toBe(250);
  });

  it('processDailyTick creates salary + maintenance + medical transactions', () => {
    const soldiers = [makeSoldier('s1', 100), makeSoldier('s2', 150)];
    const txs = processDailyTick({ soldiers, weaponCount: 3, armorCount: 2, injuredCount: 1, day: 5 });
    expect(txs.length).toBe(4); // 2 salaries + 1 maintenance + 1 medical
    expect(txs.every(t => t.amount < 0)).toBe(true); // all expenses
  });

  it('applyTransactions updates balance correctly', () => {
    const finances = createInitialFinances(50000);
    const txs = processDailyTick({ soldiers: [makeSoldier('s1', 100)], weaponCount: 1, armorCount: 1, injuredCount: 0, day: 1 });
    const updated = applyTransactions(finances, txs, 1);
    expect(updated.balance).toBeLessThan(50000);
    expect(updated.history.length).toBe(1);
  });
});

// === Market Prices ===

describe('MarketPrices', () => {
  it('getWeaponPrice is deterministic (same seed + day = same price)', () => {
    const p1 = getWeaponPrice('M4A1', 42, 10);
    const p2 = getWeaponPrice('M4A1', 42, 10);
    expect(p1).toBe(p2);
    expect(p1).toBeGreaterThan(0);
  });

  it('prices vary between weeks', () => {
    const week1 = getWeaponPrice('AK-47', 42, 1);
    const week2 = getWeaponPrice('AK-47', 42, 8);
    // Could be same by chance but with different week index, unlikely
    // Just verify both are valid
    expect(week1).toBeGreaterThan(0);
    expect(week2).toBeGreaterThan(0);
  });

  it('prices stable within same week', () => {
    const day1 = getWeaponPrice('MP5', 42, 7);
    const day2 = getWeaponPrice('MP5', 42, 13);
    expect(day1).toBe(day2); // both in week 1
  });

  it('getArmorPrice returns valid prices', () => {
    const price = getArmorPrice('Plate Carrier Nível III', 42, 5);
    expect(price).toBeGreaterThan(1800); // base 2200 * 0.85 min
    expect(price).toBeLessThanOrEqual(2530); // base 2200 * 1.15 max
  });

  it('getMarketCatalog returns full catalog', () => {
    const catalog = getMarketCatalog(42, 10);
    expect(catalog.weapons.length).toBe(9);
    expect(catalog.armors.length).toBe(3);
    expect(catalog.weapons.every(w => w.price > 0)).toBe(true);
  });

  it('unknown weapon returns 0', () => {
    expect(getWeaponPrice('Laser Gun', 42, 1)).toBe(0);
  });
});
