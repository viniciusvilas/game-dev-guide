// Iron Contract — Stage 8 Tests (Game Loop, Base, Recruitment, Persistence)

import { describe, it, expect, beforeEach } from 'vitest';
import { newGame } from '@/lib/gameLoop/gameState';
import {
  advanceDay,
  processFinanceTick,
  generateAndQueueEvents,
  resolveEventQueue,
  advanceWorldDay,
} from '@/lib/gameLoop/advanceDay';
import {
  createInitialBase,
  upgradeBuilding,
  getBuildingCost,
  getBuildingLevel,
} from '@/lib/base/baseManager';
import {
  generateRecruitPool,
  hireRecruit,
  getRecruitmentCost,
} from '@/lib/recruitment/recruitmentSystem';
import {
  serializeState,
  deserializeState,
} from '@/lib/persistence/storage';

// === newGame ===

describe('newGame', () => {
  it('is deterministic — same seed+difficulty produces same state', () => {
    const a = newGame(42, 'normal');
    const b = newGame(42, 'normal');
    // Compare key fields (avoid timestamp in worldSeed)
    expect(a.soldiers.length).toBe(b.soldiers.length);
    expect(a.factions.length).toBe(b.factions.length);
    expect(a.weapons.length).toBe(b.weapons.length);
    expect(a.currentDay).toBe(1);
    expect(a.seed).toBe(42);
  });

  it('different difficulties produce different starting conditions', () => {
    const easy = newGame(42, 'easy');
    const hard = newGame(42, 'hard');
    expect(easy.finances.balance).toBeGreaterThan(hard.finances.balance);
    expect(easy.soldiers.length).toBeGreaterThan(hard.soldiers.length);
  });

  it('creates all required state fields', () => {
    const state = newGame(123, 'normal');
    expect(state.version).toBe('1');
    expect(state.world.countries.length).toBe(2);
    expect(state.company).toBeDefined();
    expect(state.ceo).toBeDefined();
    expect(state.base).toBeDefined();
    expect(state.base.structures.length).toBe(4);
    expect(state.soldiers.length).toBe(6);
    expect(state.weapons.length).toBeGreaterThan(0);
    expect(state.armors.length).toBeGreaterThan(0);
    expect(state.factions.length).toBe(5);
    expect(state.officials.length).toBeGreaterThan(0);
    expect(state.availableContracts.length).toBe(3);
    expect(state.finances.balance).toBe(50000);
    expect(state.reputation.professional).toBe(50);
    expect(state.events).toEqual([]);
  });
});

// === advanceDay pipeline ===

describe('advanceDay', () => {
  let state: ReturnType<typeof newGame>;

  beforeEach(() => {
    state = newGame(42, 'normal');
  });

  it('processFinanceTick deducts salaries from balance', () => {
    const after = processFinanceTick(state);
    expect(after.finances.balance).toBeLessThan(state.finances.balance);
  });

  it('generateAndQueueEvents may add events to queue', () => {
    const after = generateAndQueueEvents(state);
    // Events may or may not be generated (seed-dependent), just check it runs
    expect(after.events).toBeDefined();
  });

  it('resolveEventQueue processes critical events', () => {
    // Inject a critical event
    const criticalEvent = {
      id: 'test-crit', type: 'financial_crisis' as const, day: 1,
      expiresOnDay: 5, priority: 'critical' as const,
      title: 'Test', description: 'Test crisis',
      effects: [{ targetType: 'soldier' as const, stressDelta: 10 }],
      resolved: false,
    };
    const withEvent = { ...state, events: [criticalEvent] };
    const after = resolveEventQueue(withEvent);
    const resolved = after.events.find(e => e.id === 'test-crit');
    expect(resolved?.resolved).toBe(true);
  });

  it('advanceWorldDay increments currentDay', () => {
    const after = advanceWorldDay(state);
    expect(after.currentDay).toBe(2);
    expect(after.world.currentDay).toBe(2);
  });

  it('advanceWorldDay toggles time of day', () => {
    const after1 = advanceWorldDay(state);
    expect(after1.world.timeOfDay).toBe('night');
    const after2 = advanceWorldDay(after1);
    expect(after2.world.timeOfDay).toBe('day');
  });

  it('advanceWorldDay increments daysInService', () => {
    const after = advanceWorldDay(state);
    expect(after.soldiers[0].daysInService).toBe(state.soldiers[0].daysInService + 1);
  });

  it('full advanceDay pipeline runs without errors', () => {
    const after = advanceDay(state);
    expect(after.currentDay).toBe(2);
    expect(after.finances.balance).toBeLessThan(state.finances.balance);
  });

  it('advanceDay is deterministic', () => {
    const a = advanceDay(newGame(42, 'normal'));
    const b = advanceDay(newGame(42, 'normal'));
    expect(a.currentDay).toBe(b.currentDay);
    expect(a.finances.balance).toBe(b.finances.balance);
    expect(a.soldiers.length).toBe(b.soldiers.length);
  });
});

// === Base Manager ===

describe('baseManager', () => {
  it('createInitialBase creates 4 level-1 structures', () => {
    const base = createInitialBase('city-1');
    expect(base.structures.length).toBe(4);
    expect(base.structures.every(s => s.level === 1)).toBe(true);
  });

  it('getBuildingCost increases with level', () => {
    const cost1 = getBuildingCost('barracks', 1);
    const cost2 = getBuildingCost('barracks', 2);
    expect(cost2).toBeGreaterThan(cost1);
  });

  it('upgradeBuilding increases level and capacity', () => {
    const base = createInitialBase('city-1');
    const upgraded = upgradeBuilding(base, 'barracks');
    expect(getBuildingLevel(upgraded, 'barracks')).toBe(2);
    expect(upgraded.maxSoldiers).toBeGreaterThan(base.maxSoldiers);
  });

  it('upgradeBuilding does not exceed level 5', () => {
    let base = createInitialBase('city-1');
    for (let i = 0; i < 6; i++) {
      base = upgradeBuilding(base, 'barracks');
    }
    expect(getBuildingLevel(base, 'barracks')).toBe(5);
  });
});

// === Recruitment ===

describe('recruitmentSystem', () => {
  it('generateRecruitPool is deterministic', () => {
    const a = generateRecruitPool(42, 10);
    const b = generateRecruitPool(42, 10);
    expect(a.length).toBe(b.length);
    expect(a[0].name).toBe(b[0].name);
  });

  it('generateRecruitPool produces 3-5 recruits', () => {
    for (let seed = 0; seed < 50; seed++) {
      const pool = generateRecruitPool(seed, 1);
      expect(pool.length).toBeGreaterThanOrEqual(3);
      expect(pool.length).toBeLessThanOrEqual(5);
    }
  });

  it('getRecruitmentCost is salary × 10', () => {
    const soldier = generateRecruitPool(42, 1)[0];
    expect(getRecruitmentCost(soldier)).toBe(soldier.salary * 10);
  });

  it('hireRecruit succeeds with sufficient funds', () => {
    const soldier = generateRecruitPool(42, 1)[0];
    const result = hireRecruit(soldier, 100000, 5);
    expect(result).not.toBeNull();
    expect(result!.soldier.status).toBe('available');
    expect(result!.transaction.amount).toBe(-getRecruitmentCost(soldier));
  });

  it('hireRecruit fails with insufficient funds', () => {
    const soldier = generateRecruitPool(42, 1)[0];
    const result = hireRecruit(soldier, 1, 5);
    expect(result).toBeNull();
  });
});

// === Persistence ===

describe('persistence', () => {
  it('serializeState + deserializeState roundtrip', () => {
    const state = newGame(42, 'normal');
    const serialized = serializeState(state);
    const deserialized = deserializeState(serialized);
    expect(deserialized).not.toBeNull();
    expect(deserialized!.seed).toBe(42);
    expect(deserialized!.currentDay).toBe(1);
    expect(deserialized!.soldiers.length).toBe(state.soldiers.length);
  });

  it('deserializeState returns null for wrong version', () => {
    const state = newGame(42, 'normal');
    const serialized = serializeState(state);
    const modified = serialized.replace('"version":"1"', '"version":"999"');
    expect(deserializeState(modified)).toBeNull();
  });

  it('deserializeState returns null for invalid JSON', () => {
    expect(deserializeState('not json')).toBeNull();
  });

  it('deserializeState returns null for empty object', () => {
    expect(deserializeState('{}')).toBeNull();
  });
});
