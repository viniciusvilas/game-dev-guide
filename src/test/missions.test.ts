// Iron Contract — Mission System Tests (deterministic)

import { describe, it, expect } from 'vitest';
import { validateMission } from '@/lib/missions/missionValidator';
import {
  buildCombatContext,
  buildSoldierCombatInput,
  buildFactionCombatInput,
} from '@/lib/missions/missionManager';
import { resolveSoldierOutcomesPost } from '@/lib/missions/missionResolver';
import type { Soldier } from '@/types/soldier';
import type { Contract } from '@/types/contract';
import type { Weapon, Armor } from '@/types/equipment';
import type { WorldData, City } from '@/types/world';
import type { Faction } from '@/types/faction';
import type { SoldierCombatResult } from '@/types/combat';

// === Helpers ===

function makeSoldier(overrides: Partial<Soldier> = {}): Soldier {
  return {
    id: 'sol-1', name: 'Test', rank: 'operator', status: 'available',
    attributes: { combat: 50, surveillance: 50, stealth: 50, driving: 50, medicine: 50, logistics: 50 },
    weaponMasteries: [], skills: [], stress: 50, morale: 50, salary: 100,
    equippedWeaponId: 'wpn-1', equippedArmorId: 'arm-1',
    xp: 0, missionsCompleted: 0, daysInService: 10, ...overrides,
  };
}

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'ct-1', title: 'Test', description: 'Test contract',
    type: 'security', clientId: 'gov-1', targetFactionId: 'fac-1',
    targetCityId: 'city-1', reward: 5000, penalty: 2000, durationDays: 3,
    dangerLevel: 5, requiredSoldiers: 1, expiresOnDay: 30, ...overrides,
  };
}

function makeWeapon(overrides: Partial<Weapon> = {}): Weapon {
  return {
    id: 'wpn-1', name: 'AK-47', category: 'assault_rifle',
    pfb: 30, cad: 7, pen: 15, silenciavel: false,
    condition: 90, price: 2000, repairCost: 200,
    ...overrides,
  };
}

function makeArmor(overrides: Partial<Armor> = {}): Armor {
  return {
    id: 'arm-1', name: 'Kevlar', type: 'medium',
    mtVest: 0.40, nivel: 2, condition: 85,
    price: 1500, repairCost: 150, ...overrides,
  };
}

function makeWorld(): WorldData {
  return {
    seed: { value: 42, timestamp: 0 },
    countries: [{
      id: 'country-1', name: 'TestLand', mapBounds: { x: 0, y: 0, width: 500, height: 600 }, color: '#3b82f6',
      regions: [{
        id: 'reg-1', name: 'TestRegion', countryId: 'country-1', mapBounds: { x: 0, y: 0, width: 500, height: 600 },
        cities: [{
          id: 'city-1', name: 'TestCity', regionId: 'reg-1',
          size: 'medium', population: 100000, stability: 50,
          controlledByFactionId: 'fac-1',
          pois: [{ id: 'poi-1', name: 'Base', type: 'conflict_zone', cityId: 'city-1', controlledByFactionId: 'fac-1', dangerLevel: 7 }],
          mapPosition: { x: 100, y: 100 },
          poiType: 'conflict_zone',
        }],
      }],
    }],
    
    timeOfDay: 'day',
  };
}

function makeFaction(overrides: Partial<Faction> = {}): Faction {
  return {
    id: 'fac-1', name: 'TestFac', type: 'criminal',
    leader: { name: 'Boss', title: 'Leader' },
    territory: ['city-1'], militaryPower: 50, stressBase: 1.0,
    troops: 100, troopLevel: 3, equipmentLevel: 3, equipmentMultiplier: 1.0,
    ...overrides,
  };
}

function makeSoldierResult(overrides: Partial<SoldierCombatResult> = {}): SoldierCombatResult {
  return {
    soldierId: 'sol-1', damageState: 'healthy', damageDealt: 100,
    damageTaken: 20, survivalScore: 80, weaponConditionLoss: 5,
    armorConditionLoss: 3, ...overrides,
  };
}

// === Mission Validator ===

describe('missionValidator', () => {
  it('validates a correct mission setup', () => {
    const result = validateMission(makeContract(), [makeSoldier()], 10);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.soldierErrors).toHaveLength(0);
  });

  it('rejects expired contract', () => {
    const result = validateMission(makeContract({ expiresOnDay: 5 }), [makeSoldier()], 10);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('expirou'))).toBe(true);
  });

  it('rejects insufficient squad size', () => {
    const result = validateMission(makeContract({ requiredSoldiers: 4 }), [makeSoldier()], 10);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Squad insuficiente'))).toBe(true);
  });

  it('rejects soldier without weapon', () => {
    const result = validateMission(
      makeContract(),
      [makeSoldier({ equippedWeaponId: null })],
      10,
    );
    expect(result.valid).toBe(false);
    expect(result.soldierErrors).toHaveLength(1);
    expect(result.soldierErrors[0].errors.some(e => e.includes('arma'))).toBe(true);
  });

  it('rejects soldier without armor', () => {
    const result = validateMission(
      makeContract(),
      [makeSoldier({ equippedArmorId: null })],
      10,
    );
    expect(result.valid).toBe(false);
    expect(result.soldierErrors).toHaveLength(1);
    expect(result.soldierErrors[0].errors.some(e => e.includes('colete'))).toBe(true);
  });

  it('rejects unavailable soldier', () => {
    const result = validateMission(
      makeContract(),
      [makeSoldier({ status: 'injured' })],
      10,
    );
    expect(result.valid).toBe(false);
    expect(result.soldierErrors[0].errors.some(e => e.includes('não disponível'))).toBe(true);
  });

  it('reports multiple errors per soldier', () => {
    const result = validateMission(
      makeContract(),
      [makeSoldier({ equippedWeaponId: null, equippedArmorId: null, status: 'on_mission' })],
      10,
    );
    expect(result.soldierErrors[0].errors.length).toBe(3);
  });
});

// === Mission Manager ===

describe('missionManager', () => {
  describe('buildCombatContext', () => {
    it('sets distance=medium for security_local', () => {
      const ctx = buildCombatContext(makeContract(), makeWorld(), 'frontal', 10);
      expect(ctx.distance).toBe('medium');
    });

    it('sets distance=long for invasion', () => {
      const ctx = buildCombatContext(makeContract({ type: 'tactical_invasion' }), makeWorld(), 'stealth', 10);
      expect(ctx.distance).toBe('long');
    });

    it('sets shelter based on city POI type', () => {
      const ctx = buildCombatContext(makeContract(), makeWorld(), 'frontal', 10);
      expect(ctx.shelter).toBe(2); // conflict_zone → 2
    });

    it('sets intel based on days advance', () => {
      // expiresOnDay=30, currentDay=10 → daysAdvance=20 → intel=3
      const ctx = buildCombatContext(makeContract(), makeWorld(), 'frontal', 10);
      expect(ctx.intel).toBe(3);
    });

    it('sets low intel for last-minute missions', () => {
      // expiresOnDay=11, currentDay=10 → daysAdvance=1 → intel=0
      const ctx = buildCombatContext(makeContract({ expiresOnDay: 11 }), makeWorld(), 'frontal', 10);
      expect(ctx.intel).toBe(0);
    });

    it('sets intel=2 with moderate advance', () => {
      // expiresOnDay=15, currentDay=10 → daysAdvance=5 → intel=2
      const ctx = buildCombatContext(makeContract({ expiresOnDay: 15 }), makeWorld(), 'frontal', 10);
      expect(ctx.intel).toBe(2);
    });

    it('passes approach and timeOfDay from inputs', () => {
      const ctx = buildCombatContext(makeContract(), makeWorld(), 'stealth', 10);
      expect(ctx.approach).toBe('stealth');
      expect(ctx.timeOfDay).toBe('day');
    });
  });

  describe('buildSoldierCombatInput', () => {
    it('correctly maps soldier + weapon + armor to combat input', () => {
      const input = buildSoldierCombatInput(makeSoldier(), makeWeapon(), makeArmor());
      expect(input.soldierId).toBe('sol-1');
      expect(input.combat).toBe(50);
      expect(input.pfb).toBe(30);
      expect(input.mtVest).toBe(0.40);
      expect(input.armorNivel).toBe(2);
      expect(input.weaponCategory).toBe('assault_rifle');
    });
  });

  describe('buildFactionCombatInput', () => {
    it('builds correct faction input', () => {
      const city = makeWorld().countries[0].regions[0].cities[0];
      const input = buildFactionCombatInput(makeFaction(), city);
      expect(input.factionId).toBe('fac-1');
      expect(input.troops).toBe(100);
      expect(input.shelterBonus).toBe(2); // conflict_zone
    });
  });
});

// === Mission Resolver ===

describe('missionResolver', () => {
  it('sets healthy soldier to available after victory', () => {
    const soldiers = [makeSoldier()];
    const results = [makeSoldierResult({ damageState: 'healthy' })];
    const resolved = resolveSoldierOutcomesPost(soldiers, results, true, 10);
    expect(resolved[0].soldier.status).toBe('available');
    expect(resolved[0].soldier.missionsCompleted).toBe(1);
  });

  it('sets light_wound soldier to injured', () => {
    const soldiers = [makeSoldier()];
    const results = [makeSoldierResult({ damageState: 'light_wound' })];
    const resolved = resolveSoldierOutcomesPost(soldiers, results, true, 10);
    expect(resolved[0].soldier.status).toBe('injured');
    expect(resolved[0].soldier.injuredSinceDay).toBe(10);
  });

  it('sets heavy_wound soldier to severely_injured', () => {
    const soldiers = [makeSoldier()];
    const results = [makeSoldierResult({ damageState: 'heavy_wound' })];
    const resolved = resolveSoldierOutcomesPost(soldiers, results, false, 10);
    expect(resolved[0].soldier.status).toBe('severely_injured');
  });

  it('sets critical soldier to unconscious', () => {
    const soldiers = [makeSoldier()];
    const results = [makeSoldierResult({ damageState: 'critical' })];
    const resolved = resolveSoldierOutcomesPost(soldiers, results, false, 10);
    expect(resolved[0].soldier.status).toBe('unconscious');
  });

  it('sets dead soldier to dead and does not increment missions', () => {
    const soldiers = [makeSoldier()];
    const results = [makeSoldierResult({ damageState: 'dead' })];
    const resolved = resolveSoldierOutcomesPost(soldiers, results, false, 10);
    expect(resolved[0].soldier.status).toBe('dead');
    expect(resolved[0].soldier.missionsCompleted).toBe(0);
  });

  it('victory reduces stress impact', () => {
    const soldiers = [makeSoldier({ stress: 50 })];
    const resultsVictory = resolveSoldierOutcomesPost(soldiers, [makeSoldierResult({ damageState: 'light_wound' })], true, 10);
    const resultsDefeat = resolveSoldierOutcomesPost(soldiers, [makeSoldierResult({ damageState: 'light_wound' })], false, 10);
    expect(resultsVictory[0].soldier.stress).toBeLessThan(resultsDefeat[0].soldier.stress);
  });

  it('victory boosts morale for healthy soldier', () => {
    const soldiers = [makeSoldier({ morale: 50 })];
    const resolved = resolveSoldierOutcomesPost(soldiers, [makeSoldierResult()], true, 10);
    expect(resolved[0].soldier.morale).toBe(60); // +10
  });

  it('defeat decreases morale', () => {
    const soldiers = [makeSoldier({ morale: 50 })];
    const resolved = resolveSoldierOutcomesPost(soldiers, [makeSoldierResult()], false, 10);
    expect(resolved[0].soldier.morale).toBe(40); // -10
  });

  it('does not modify soldiers not in combat results', () => {
    const soldiers = [makeSoldier({ id: 'sol-2' })];
    const results = [makeSoldierResult({ soldierId: 'sol-1' })];
    const resolved = resolveSoldierOutcomesPost(soldiers, results, true, 10);
    expect(resolved[0].soldier.status).toBe('available');
    expect(resolved[0].soldier.missionsCompleted).toBe(0);
  });
});
