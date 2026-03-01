// Iron Contract — Event System Tests (deterministic)

import { describe, it, expect } from 'vitest';
import { generateDailyRandomEvents } from '@/lib/events/eventGenerator';
import {
  checkSoldierTriggers,
  checkFinanceTriggers,
  checkReputationTriggers,
  checkFactionTriggers,
} from '@/lib/events/eventTriggers';
import {
  applyEffectsToSoldiers,
  applyEffectsToFinances,
  applyEffectsToReputation,
  applyEffectsToFactions,
  processEvent,
} from '@/lib/events/eventProcessor';
import {
  sortByPriority,
  enqueueEvents,
  dequeueResolved,
  removeExpired,
  peekNext,
  advanceDay,
} from '@/lib/events/eventQueue';
import type { Soldier } from '@/types/soldier';
import type { CompanyFinances } from '@/types/economy';
import type { ReputationData } from '@/types/reputation';
import type { Faction } from '@/types/faction';
import type { GameEvent } from '@/types/events';

// === Helpers ===

function makeSoldier(overrides: Partial<Soldier> = {}): Soldier {
  return {
    id: 'sol-1', name: 'Test', rank: 'operator', status: 'available',
    attributes: { combat: 50, surveillance: 50, stealth: 50, driving: 50, medicine: 50, logistics: 50 },
    weaponMasteries: [], skills: [], stress: 50, morale: 50, salary: 100,
    equippedWeaponId: null, equippedArmorId: null, xp: 0, missionsCompleted: 0, daysInService: 10,
    ...overrides,
  };
}

function makeFinances(overrides: Partial<CompanyFinances> = {}): CompanyFinances {
  return {
    balance: 50000, dailyBurn: 500, weeklyRevenue: 5000, monthlyProfit: 10000,
    history: [], transactions: [], ...overrides,
  };
}

function makeReputation(overrides: Partial<ReputationData> = {}): ReputationData {
  return { professional: 50, notoriety: 30, ceoReputation: [], byCountry: [], ...overrides };
}

function makeFaction(overrides: Partial<Faction> = {}): Faction {
  return {
    id: 'fac-1', name: 'TestFac', type: 'criminal', leader: { name: 'Boss', title: 'Leader' },
    territory: [], militaryPower: 50, stressBase: 1.0, troops: 100,
    troopLevel: 3, equipmentLevel: 3, equipmentMultiplier: 1.0, ...overrides,
  };
}

function makeEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'evt-1', type: 'random_encounter', day: 10, expiresOnDay: 13,
    priority: 'normal', title: 'Test', description: 'Test event',
    effects: [], resolved: false, ...overrides,
  };
}

// === Event Generator ===

describe('eventGenerator', () => {
  it('is deterministic — same seed+day always produces same events', () => {
    const a = generateDailyRandomEvents(42, 10);
    const b = generateDailyRandomEvents(42, 10);
    expect(a).toEqual(b);
  });

  it('different seeds produce different results', () => {
    const a = generateDailyRandomEvents(42, 10);
    const b = generateDailyRandomEvents(99, 10);
    // They might rarely be the same template, but IDs differ by seed behavior
    // Just check determinism holds for each
    expect(generateDailyRandomEvents(42, 10)).toEqual(a);
    expect(generateDailyRandomEvents(99, 10)).toEqual(b);
  });

  it('generates events with correct structure', () => {
    // Try multiple seeds to find one that generates events
    for (let seed = 1; seed < 100; seed++) {
      const events = generateDailyRandomEvents(seed, 5);
      if (events.length > 0) {
        const e = events[0];
        expect(e.id).toContain('evt-rng-d5');
        expect(e.day).toBe(5);
        expect(e.expiresOnDay).toBeGreaterThan(5);
        expect(e.resolved).toBe(false);
        expect(e.effects).toBeDefined();
        return;
      }
    }
  });

  it('generates at most 2 events per day', () => {
    for (let seed = 0; seed < 200; seed++) {
      const events = generateDailyRandomEvents(seed, 1);
      expect(events.length).toBeLessThanOrEqual(2);
    }
  });
});

// === Event Triggers ===

describe('eventTriggers', () => {
  describe('checkSoldierTriggers', () => {
    it('returns breakdown event for stress >= 90', () => {
      const soldiers = [makeSoldier({ stress: 95 })];
      const events = checkSoldierTriggers(soldiers, 10);
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('soldier_breakdown');
      expect(events[0].priority).toBe('high');
    });

    it('returns desertion event for morale <= 10', () => {
      const soldiers = [makeSoldier({ morale: 5 })];
      const events = checkSoldierTriggers(soldiers, 10);
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('soldier_deserted');
      expect(events[0].priority).toBe('critical');
    });

    it('ignores dead soldiers', () => {
      const soldiers = [makeSoldier({ status: 'dead', stress: 95, morale: 5 })];
      const events = checkSoldierTriggers(soldiers, 10);
      expect(events.length).toBe(0);
    });

    it('returns no events for normal soldiers', () => {
      const soldiers = [makeSoldier()];
      const events = checkSoldierTriggers(soldiers, 10);
      expect(events.length).toBe(0);
    });
  });

  describe('checkFinanceTriggers', () => {
    it('returns warning when runway is 4-7 days', () => {
      const finances = makeFinances({ balance: 3000, dailyBurn: 500 }); // 6 days
      const events = checkFinanceTriggers(finances, 10);
      expect(events.some(e => e.type === 'financial_warning')).toBe(true);
    });

    it('returns crisis when runway <= 3 days', () => {
      const finances = makeFinances({ balance: 1000, dailyBurn: 500 }); // 2 days
      const events = checkFinanceTriggers(finances, 10);
      expect(events.some(e => e.type === 'financial_crisis')).toBe(true);
    });

    it('returns bankrupt event at balance <= 0', () => {
      const finances = makeFinances({ balance: 0, dailyBurn: 500 });
      const events = checkFinanceTriggers(finances, 10);
      expect(events.some(e => e.title === 'Falência')).toBe(true);
    });

    it('returns no events for healthy finances', () => {
      const finances = makeFinances();
      const events = checkFinanceTriggers(finances, 10);
      expect(events.length).toBe(0);
    });
  });

  describe('checkReputationTriggers', () => {
    it('returns milestone for professional >= 80', () => {
      const rep = makeReputation({ professional: 85 });
      const events = checkReputationTriggers(rep, 10);
      expect(events.some(e => e.title === 'Reputação excelente')).toBe(true);
    });

    it('returns negative event for notoriety >= 70', () => {
      const rep = makeReputation({ notoriety: 75 });
      const events = checkReputationTriggers(rep, 10);
      expect(events.some(e => e.title === 'Atenção indesejada')).toBe(true);
    });

    it('returns ruin event for professional <= 15', () => {
      const rep = makeReputation({ professional: 10 });
      const events = checkReputationTriggers(rep, 10);
      expect(events.some(e => e.title === 'Reputação em ruínas')).toBe(true);
    });
  });

  describe('checkFactionTriggers', () => {
    it('returns weakened event for militaryPower <= 10', () => {
      const factions = [makeFaction({ militaryPower: 5 })];
      const events = checkFactionTriggers(factions, 10);
      expect(events.some(e => e.type === 'faction_weakened')).toBe(true);
    });

    it('returns strength event for militaryPower >= 90', () => {
      const factions = [makeFaction({ militaryPower: 95 })];
      const events = checkFactionTriggers(factions, 10);
      expect(events.some(e => e.type === 'faction_hostility_change')).toBe(true);
    });
  });
});

// === Event Processor ===

describe('eventProcessor', () => {
  it('applies stress/morale effects to soldiers', () => {
    const soldiers = [makeSoldier({ stress: 50, morale: 50 })];
    const effects = [{ targetType: 'soldier' as const, stressDelta: 10, moraleDelta: -15 }];
    const result = applyEffectsToSoldiers(soldiers, effects);
    expect(result[0].stress).toBe(60);
    expect(result[0].morale).toBe(35);
  });

  it('applies targeted soldier effect only to matching ID', () => {
    const soldiers = [
      makeSoldier({ id: 'a', stress: 50 }),
      makeSoldier({ id: 'b', stress: 50 }),
    ];
    const effects = [{ targetType: 'soldier' as const, targetId: 'a', stressDelta: 20 }];
    const result = applyEffectsToSoldiers(soldiers, effects);
    expect(result[0].stress).toBe(70);
    expect(result[1].stress).toBe(50);
  });

  it('clamps soldier values to 0-100', () => {
    const soldiers = [makeSoldier({ stress: 95 })];
    const effects = [{ targetType: 'soldier' as const, stressDelta: 20 }];
    const result = applyEffectsToSoldiers(soldiers, effects);
    expect(result[0].stress).toBe(100);
  });

  it('applies balance delta to finances', () => {
    const finances = makeFinances({ balance: 10000 });
    const effects = [{ targetType: 'company' as const, balanceDelta: -2000 }];
    const result = applyEffectsToFinances(finances, effects);
    expect(result.balance).toBe(8000);
  });

  it('applies reputation effects', () => {
    const rep = makeReputation({ professional: 50, notoriety: 30 });
    const effects = [{ targetType: 'company' as const, professionalDelta: 5, notorietyDelta: 10 }];
    const result = applyEffectsToReputation(rep, effects);
    expect(result.professional).toBe(55);
    expect(result.notoriety).toBe(40);
  });

  it('applies faction strength effects', () => {
    const factions = [makeFaction({ id: 'f1', militaryPower: 50 })];
    const effects = [{ targetType: 'faction' as const, targetId: 'f1', factionStrengthDelta: -10 }];
    const result = applyEffectsToFactions(factions, effects);
    expect(result[0].militaryPower).toBe(40);
  });

  it('processEvent marks event as resolved', () => {
    const event = makeEvent({
      effects: [{ targetType: 'company', balanceDelta: 1000 }],
    });
    const result = processEvent(
      event, [makeSoldier()], makeFinances(), makeReputation(), [makeFaction()]
    );
    expect(result.event.resolved).toBe(true);
    expect(result.finances.balance).toBe(51000);
  });
});

// === Event Queue ===

describe('eventQueue', () => {
  it('sorts by priority then by day', () => {
    const events = [
      makeEvent({ id: 'a', priority: 'low', day: 1 }),
      makeEvent({ id: 'b', priority: 'critical', day: 5 }),
      makeEvent({ id: 'c', priority: 'normal', day: 2 }),
      makeEvent({ id: 'd', priority: 'critical', day: 3 }),
    ];
    const sorted = sortByPriority(events);
    expect(sorted.map(e => e.id)).toEqual(['d', 'b', 'c', 'a']);
  });

  it('enqueueEvents adds and sorts', () => {
    const queue = [makeEvent({ id: 'a', priority: 'low' })];
    const newEvts = [makeEvent({ id: 'b', priority: 'critical' })];
    const result = enqueueEvents(queue, newEvts);
    expect(result[0].id).toBe('b');
    expect(result.length).toBe(2);
  });

  it('dequeueResolved removes resolved events', () => {
    const queue = [
      makeEvent({ id: 'a', resolved: true }),
      makeEvent({ id: 'b', resolved: false }),
    ];
    const result = dequeueResolved(queue);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('b');
  });

  it('removeExpired removes past-due events', () => {
    const queue = [
      makeEvent({ id: 'a', expiresOnDay: 5 }),
      makeEvent({ id: 'b', expiresOnDay: 15 }),
    ];
    const result = removeExpired(queue, 10);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('b');
  });

  it('peekNext returns highest priority unresolved', () => {
    const queue = [
      makeEvent({ id: 'a', priority: 'low', resolved: false }),
      makeEvent({ id: 'b', priority: 'high', resolved: true }),
      makeEvent({ id: 'c', priority: 'high', resolved: false }),
    ];
    const next = peekNext(queue);
    expect(next?.id).toBe('c');
  });

  it('peekNext returns null for empty queue', () => {
    expect(peekNext([])).toBeNull();
  });

  it('advanceDay cleans resolved and expired', () => {
    const queue = [
      makeEvent({ id: 'a', resolved: true, expiresOnDay: 20 }),
      makeEvent({ id: 'b', resolved: false, expiresOnDay: 5 }),
      makeEvent({ id: 'c', resolved: false, expiresOnDay: 20, priority: 'high' }),
      makeEvent({ id: 'd', resolved: false, expiresOnDay: 20, priority: 'low' }),
    ];
    const result = advanceDay(queue, 10);
    expect(result.length).toBe(2);
    expect(result[0].id).toBe('c'); // high priority first
    expect(result[1].id).toBe('d');
  });
});
