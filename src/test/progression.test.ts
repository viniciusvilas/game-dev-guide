// Iron Contract — Progression System Tests (deterministic)

import { describe, it, expect } from 'vitest';
import {
  calculateSoldierXP,
  applySoldierXP,
} from '@/lib/progression/xpEngine';
import {
  getNextRank,
  getRankIndex,
  canPromote,
  promote,
  getSkillsUnlockedAtRank,
  getAvailableSkills,
  getRankRequirements,
} from '@/lib/progression/rankSystem';
import {
  calculateDailyGain,
  createTrainingSession,
  processTraining,
  applyTrainingResult,
  trainingToTransaction,
} from '@/lib/progression/trainingSystem';
import {
  calculateMasteryGain,
  applyMasteryGain,
  getMasteryLevel,
} from '@/lib/progression/weaponMasterySystem';
import type { SoldierCombatResult } from '@/types/combat';
import type { Contract } from '@/types/contract';
import type { Soldier, SoldierAttributes } from '@/types/soldier';

// === Helpers ===

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'ct-1', title: 'Test', description: 'Test contract',
    type: 'security_local', clientId: 'gov-1', targetFactionId: 'fac-1',
    targetCityId: 'city-1', reward: 5000, penalty: 2000, durationDays: 3,
    dangerLevel: 5, requiredSoldiers: 4, expiresOnDay: 30, ...overrides,
  };
}

function makeSoldierResult(overrides: Partial<SoldierCombatResult> = {}): SoldierCombatResult {
  return {
    soldierId: 'sol-1', damageState: 'healthy', damageDealt: 100,
    damageTaken: 20, survivalScore: 80, weaponConditionLoss: 5,
    armorConditionLoss: 3, ...overrides,
  };
}

function makeSoldier(overrides: Partial<Soldier> = {}): Soldier {
  return {
    id: 'sol-1', name: 'Test', rank: 'operator', status: 'available',
    attributes: { combat: 50, surveillance: 50, stealth: 50, driving: 50, medicine: 50, logistics: 50 },
    weaponMasteries: [{ category: 'assault_rifle', level: 40 }],
    skills: [], stress: 50, morale: 50, salary: 100,
    equippedWeaponId: null, equippedArmorId: null, xp: 0,
    missionsCompleted: 0, daysInService: 10, ...overrides,
  };
}

function makeAttributes(overrides: Partial<SoldierAttributes> = {}): SoldierAttributes {
  return { combat: 50, surveillance: 50, stealth: 50, driving: 50, medicine: 50, logistics: 50, ...overrides };
}

// === XP Engine ===

describe('xpEngine', () => {
  it('dead soldiers earn 0 XP', () => {
    const result = makeSoldierResult({ damageState: 'dead' });
    expect(calculateSoldierXP(result, makeContract())).toBe(0);
  });

  it('healthy soldiers earn base XP + danger bonus', () => {
    const result = makeSoldierResult({ damageState: 'healthy', damageDealt: 0 });
    const contract = makeContract({ dangerLevel: 5 });
    // BASE 25 + 5*5 = 50, multiplier 1.0, damage bonus 0
    expect(calculateSoldierXP(result, contract)).toBe(50);
  });

  it('light_wound gives survival bonus (1.2x)', () => {
    const result = makeSoldierResult({ damageState: 'light_wound', damageDealt: 0 });
    const contract = makeContract({ dangerLevel: 5 });
    // floor(50 * 1.2) = 60
    expect(calculateSoldierXP(result, contract)).toBe(60);
  });

  it('heavy_wound gives survival bonus (1.3x)', () => {
    const result = makeSoldierResult({ damageState: 'heavy_wound', damageDealt: 0 });
    const contract = makeContract({ dangerLevel: 5 });
    // floor(50 * 1.3) = 65
    expect(calculateSoldierXP(result, contract)).toBe(65);
  });

  it('critical gives reduced XP (0.6x)', () => {
    const result = makeSoldierResult({ damageState: 'critical', damageDealt: 0 });
    const contract = makeContract({ dangerLevel: 5 });
    // floor(50 * 0.6) = 30
    expect(calculateSoldierXP(result, contract)).toBe(30);
  });

  it('damage dealt adds bonus XP', () => {
    const result = makeSoldierResult({ damageState: 'healthy', damageDealt: 200 });
    const contract = makeContract({ dangerLevel: 5 });
    // 50 + floor(200/50) = 50 + 4 = 54
    expect(calculateSoldierXP(result, contract)).toBe(54);
  });

  it('applySoldierXP adds XP to soldier', () => {
    const soldier = { xp: 100 };
    const updated = applySoldierXP(soldier, 50);
    expect(updated.xp).toBe(150);
  });
});

// === Rank System ===

describe('rankSystem', () => {
  it('getNextRank returns correct next rank', () => {
    expect(getNextRank('recruit')).toBe('operator');
    expect(getNextRank('captain')).toBe('major');
    expect(getNextRank('major')).toBeNull();
  });

  it('getRankIndex returns correct index', () => {
    expect(getRankIndex('recruit')).toBe(0);
    expect(getRankIndex('major')).toBe(7);
  });

  it('canPromote returns true when requirements met', () => {
    expect(canPromote('recruit', 50, 2)).toBe(true);
    expect(canPromote('recruit', 49, 2)).toBe(false);
    expect(canPromote('recruit', 50, 1)).toBe(false);
  });

  it('canPromote returns false for max rank', () => {
    expect(canPromote('major', 99999, 99999)).toBe(false);
  });

  it('promote returns next rank when eligible', () => {
    expect(promote('recruit', 50, 2)).toBe('operator');
  });

  it('promote returns same rank when not eligible', () => {
    expect(promote('recruit', 10, 0)).toBe('recruit');
  });

  it('getSkillsUnlockedAtRank returns correct skills', () => {
    expect(getSkillsUnlockedAtRank('operator')).toEqual(['scout']);
    expect(getSkillsUnlockedAtRank('corporal')).toEqual(['medic', 'communications']);
    expect(getSkillsUnlockedAtRank('recruit')).toEqual([]);
  });

  it('getAvailableSkills accumulates skills up to rank', () => {
    const skills = getAvailableSkills('sergeant');
    expect(skills).toContain('scout');
    expect(skills).toContain('medic');
    expect(skills).toContain('communications');
    expect(skills).toContain('demolitions');
    expect(skills).not.toContain('sniper');
  });

  it('getRankRequirements returns correct data', () => {
    const req = getRankRequirements('sergeant');
    expect(req.minXP).toBe(350);
    expect(req.minMissions).toBe(10);
  });
});

// === Training System ===

describe('trainingSystem', () => {
  it('calculateDailyGain returns 3 below 60', () => {
    expect(calculateDailyGain(40)).toBe(3);
  });

  it('calculateDailyGain returns 2 at 60-79', () => {
    expect(calculateDailyGain(65)).toBe(2);
  });

  it('calculateDailyGain returns 1 at 80-94', () => {
    expect(calculateDailyGain(85)).toBe(1);
  });

  it('calculateDailyGain returns 0 at 95+', () => {
    expect(calculateDailyGain(95)).toBe(0);
  });

  it('createTrainingSession uses correct cost', () => {
    const session = createTrainingSession('sol-1', 'combat', 5);
    expect(session.costPerDay).toBe(80);
    expect(session.durationDays).toBe(5);
  });

  it('processTraining calculates correct gain and cost', () => {
    const session = createTrainingSession('sol-1', 'combat', 3);
    const attrs = makeAttributes({ combat: 50 });
    const result = processTraining(session, attrs);
    expect(result.pointsGained).toBe(9); // 3 days * 3 points
    expect(result.totalCost).toBe(240);  // 3 days * $80
  });

  it('processTraining applies diminishing returns', () => {
    const session = createTrainingSession('sol-1', 'logistics', 5);
    const attrs = makeAttributes({ logistics: 78 });
    const result = processTraining(session, attrs);
    // Day 1-2: level 78,81 → gain 2,1 (crosses 80 boundary)
    // Days 3-5: level 82,83,84 → gain 1,1,1
    expect(result.pointsGained).toBe(6); // 2+1+1+1+1
  });

  it('applyTrainingResult updates attributes correctly', () => {
    const attrs = makeAttributes({ stealth: 50 });
    const result = { soldierId: 'sol-1', attributeGained: 'stealth' as const, pointsGained: 9, totalCost: 180 };
    const updated = applyTrainingResult(attrs, result);
    expect(updated.stealth).toBe(59);
  });

  it('applyTrainingResult clamps to 100', () => {
    const attrs = makeAttributes({ combat: 98 });
    const result = { soldierId: 'sol-1', attributeGained: 'combat' as const, pointsGained: 10, totalCost: 800 };
    const updated = applyTrainingResult(attrs, result);
    expect(updated.combat).toBe(100);
  });

  it('trainingToTransaction creates correct transaction', () => {
    const result = { soldierId: 'sol-1', attributeGained: 'combat' as const, pointsGained: 9, totalCost: 240 };
    const tx = trainingToTransaction(result, 15);
    expect(tx.amount).toBe(-240);
    expect(tx.day).toBe(15);
    expect(tx.type).toBe('training');
  });
});

// === Weapon Mastery System ===

describe('weaponMasterySystem', () => {
  it('getMasteryLevel returns 0 for unknown category', () => {
    const soldier = makeSoldier({ weaponMasteries: [] });
    expect(getMasteryLevel(soldier, 'pistol')).toBe(0);
  });

  it('getMasteryLevel returns correct level for known category', () => {
    const soldier = makeSoldier();
    expect(getMasteryLevel(soldier, 'assault_rifle')).toBe(40);
  });

  it('calculateMasteryGain returns positive gain below 60', () => {
    const soldier = makeSoldier({ weaponMasteries: [{ category: 'assault_rifle', level: 30 }] });
    const gain = calculateMasteryGain(soldier, 'assault_rifle', 2);
    expect(gain).toBe(6); // 2*3 = 6, full rate
  });

  it('calculateMasteryGain applies diminishing returns above 60', () => {
    const soldier = makeSoldier({ weaponMasteries: [{ category: 'assault_rifle', level: 65 }] });
    const gain = calculateMasteryGain(soldier, 'assault_rifle', 2);
    // base 6, * 0.6 = 3
    expect(gain).toBe(3);
  });

  it('calculateMasteryGain applies strong diminishing above 90', () => {
    const soldier = makeSoldier({ weaponMasteries: [{ category: 'assault_rifle', level: 92 }] });
    const gain = calculateMasteryGain(soldier, 'assault_rifle', 2);
    // base 6, * 0.2 = 1
    expect(gain).toBe(1);
  });

  it('calculateMasteryGain returns 0 at 100', () => {
    const soldier = makeSoldier({ weaponMasteries: [{ category: 'assault_rifle', level: 100 }] });
    expect(calculateMasteryGain(soldier, 'assault_rifle', 5)).toBe(0);
  });

  it('calculateMasteryGain works for new category (level 0)', () => {
    const soldier = makeSoldier({ weaponMasteries: [] });
    const gain = calculateMasteryGain(soldier, 'pistol', 3);
    expect(gain).toBe(9); // 3*3 = 9, full rate
  });

  it('applyMasteryGain updates existing mastery', () => {
    const soldier = makeSoldier();
    const updated = applyMasteryGain(soldier, 'assault_rifle', 10);
    expect(getMasteryLevel(updated, 'assault_rifle')).toBe(50);
  });

  it('applyMasteryGain creates new mastery entry', () => {
    const soldier = makeSoldier({ weaponMasteries: [] });
    const updated = applyMasteryGain(soldier, 'smg', 15);
    expect(getMasteryLevel(updated, 'smg')).toBe(15);
  });

  it('applyMasteryGain clamps to 100', () => {
    const soldier = makeSoldier({ weaponMasteries: [{ category: 'pistol', level: 95 }] });
    const updated = applyMasteryGain(soldier, 'pistol', 20);
    expect(getMasteryLevel(updated, 'pistol')).toBe(100);
  });

  it('applyMasteryGain with 0 gain returns same soldier', () => {
    const soldier = makeSoldier();
    const updated = applyMasteryGain(soldier, 'assault_rifle', 0);
    expect(updated).toBe(soldier); // reference equality
  });
});
