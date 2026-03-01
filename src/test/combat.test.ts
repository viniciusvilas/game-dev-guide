import { describe, it, expect } from 'vitest';
import { createRng } from '@/lib/generators/seededRandom';
import {
  calculatePS,
  calculateDPS,
  calculateEffectiveHP,
  calculateSoldierDPS,
  calculateSquadDPS,
  calculateFactionDPS,
  calculateFactionHP,
  getDistanceModifier,
  getShelterReduction,
  getIntelModifier,
  calculatePenetrationFactor,
} from '@/lib/combat/damageModel';
import { resolvePhase1, resolvePhase2, resolvePhase3, resolveMomentum } from '@/lib/combat/momentumEngine';
import { resolveTTKRace, blendResults } from '@/lib/combat/ttkRace';
import { calculateSurvivalScore, resolveSoldierOutcomes } from '@/lib/combat/combatResolver';
import { generateNarrative } from '@/lib/combat/narrativeGenerator';
import { resolveCombat } from '@/lib/combat/combatEngine';
import type { SoldierCombatInput, FactionCombatInput, MissionCombatContext, CombatResult } from '@/types/combat';

// === Test Fixtures ===

function makeSoldier(overrides: Partial<SoldierCombatInput> = {}): SoldierCombatInput {
  return {
    soldierId: 'soldier-1',
    rank: 'sergeant',
    stress: 20,
    morale: 70,
    combat: 65,
    surveillance: 55,
    stealth: 45,
    weaponCategory: 'assault_rifle',
    pfb: 45,
    cad: 7,
    pen: 3.2,
    silenced: false,
    mtVest: 0.45,
    armorNivel: 2,
    ...overrides,
  };
}

function makeFaction(overrides: Partial<FactionCombatInput> = {}): FactionCombatInput {
  return {
    factionId: 'faction-1',
    troops: 30,
    troopLevel: 3,
    equipmentLevel: 3,
    equipmentMultiplier: 1.0,
    stressBase: 1.0,
    shelterBonus: 1,
    ...overrides,
  };
}

function makeContext(overrides: Partial<MissionCombatContext> = {}): MissionCombatContext {
  return {
    distance: 'medium',
    shelter: 1,
    intel: 2,
    approach: 'frontal',
    timeOfDay: 'day',
    ...overrides,
  };
}

// === Damage Model Tests ===

describe('Damage Model', () => {
  it('calculateDPS = pfb * cad / 10', () => {
    expect(calculateDPS(45, 7)).toBe(31.5);
    expect(calculateDPS(85, 1)).toBe(8.5);
    expect(calculateDPS(55, 10)).toBe(55);
  });

  it('calculateEffectiveHP follows formula HP = 100 / (1 - mtVest)', () => {
    expect(calculateEffectiveHP(0)).toBe(100);
    expect(calculateEffectiveHP(0.45)).toBeCloseTo(181.82, 1);
    expect(calculateEffectiveHP(0.72)).toBeCloseTo(357.14, 1);
    expect(calculateEffectiveHP(0.88)).toBeCloseTo(833.33, 0);
  });

  it('calculateEffectiveHP clamps mtVest to 0-0.88', () => {
    expect(calculateEffectiveHP(-0.5)).toBe(100);
    expect(calculateEffectiveHP(0.95)).toBeCloseTo(833.33, 0);
  });

  it('calculatePS returns positive value', () => {
    const s = makeSoldier();
    const ps = calculatePS(s);
    expect(ps).toBeGreaterThan(0);
  });

  it('higher combat stat = higher PS', () => {
    const low = calculatePS(makeSoldier({ combat: 20 }));
    const high = calculatePS(makeSoldier({ combat: 90 }));
    expect(high).toBeGreaterThan(low);
  });

  it('getDistanceModifier returns correct values', () => {
    expect(getDistanceModifier('close', 'shotgun')).toBe(1.4);
    expect(getDistanceModifier('long', 'precision_rifle')).toBe(1.5);
    expect(getDistanceModifier('medium', 'assault_rifle')).toBe(1.2);
  });

  it('getShelterReduction ranges from 0 to 0.5', () => {
    expect(getShelterReduction(0)).toBe(0);
    expect(getShelterReduction(3)).toBe(0.5);
  });

  it('getIntelModifier ranges from 0.70 to 1.15', () => {
    expect(getIntelModifier(0)).toBe(0.70);
    expect(getIntelModifier(3)).toBe(1.15);
  });

  it('calculatePenetrationFactor: pen > armor = bonus', () => {
    expect(calculatePenetrationFactor(5, 2)).toBeGreaterThan(1);
    expect(calculatePenetrationFactor(1, 4)).toBeLessThan(1);
    expect(calculatePenetrationFactor(3, 3)).toBe(1);
  });
});

// === Momentum Engine Tests ===

describe('Momentum Engine', () => {
  it('resolvePhase1 is deterministic', () => {
    const s = [makeSoldier()];
    const f = makeFaction();
    const ctx = makeContext();
    const r1 = resolvePhase1(createRng(42), s, f, ctx);
    const r2 = resolvePhase1(createRng(42), s, f, ctx);
    expect(r1.momentumShift).toBe(r2.momentumShift);
    expect(r1.playerDamageDealt).toBe(r2.playerDamageDealt);
  });

  it('resolveMomentum returns 3 phases', () => {
    const result = resolveMomentum(createRng(42), [makeSoldier()], makeFaction(), makeContext());
    expect(result.phases).toHaveLength(3);
    expect(result.phases[0].phase).toBe('engagement');
    expect(result.phases[1].phase).toBe('firefight');
    expect(result.phases[2].phase).toBe('resolution');
  });

  it('resolveMomentum is deterministic', () => {
    const s = [makeSoldier(), makeSoldier({ soldierId: 'soldier-2' })];
    const r1 = resolveMomentum(createRng(99), s, makeFaction(), makeContext());
    const r2 = resolveMomentum(createRng(99), s, makeFaction(), makeContext());
    expect(r1.finalMomentum).toBe(r2.finalMomentum);
    expect(r1.outcome).toBe(r2.outcome);
  });

  it('momentum clamped to [-100, 100]', () => {
    const result = resolveMomentum(createRng(42), [makeSoldier()], makeFaction(), makeContext());
    expect(result.finalMomentum).toBeGreaterThanOrEqual(-100);
    expect(result.finalMomentum).toBeLessThanOrEqual(100);
  });
});

// === TTK Race Tests ===

describe('TTK Race', () => {
  it('resolveTTKRace is deterministic (pure, no RNG)', () => {
    const s = [makeSoldier()];
    const f = makeFaction();
    const ctx = makeContext();
    const r1 = resolveTTKRace(s, f, ctx);
    const r2 = resolveTTKRace(s, f, ctx);
    expect(r1.ttkRatio).toBe(r2.ttkRatio);
    expect(r1.outcome).toBe(r2.outcome);
  });

  it('ttkRatio > 0', () => {
    const result = resolveTTKRace([makeSoldier()], makeFaction(), makeContext());
    expect(result.ttkRatio).toBeGreaterThan(0);
  });

  it('blendResults: n <= 14 uses pure momentum', () => {
    const mResult = { phases: [], finalMomentum: 50, outcome: 'victory' as const };
    const tResult = { playerTTK: 10, enemyTTK: 5, ttkRatio: 2, outcome: 'defeat' as const };
    const blended = blendResults(mResult, tResult, 10);
    expect(blended.wTTK).toBe(0);
    expect(blended.outcome).toBe('victory'); // pure momentum
  });

  it('blendResults: n >= 50 uses pure TTK', () => {
    const mResult = { phases: [], finalMomentum: -50, outcome: 'defeat' as const };
    const tResult = { playerTTK: 3, enemyTTK: 10, ttkRatio: 0.3, outcome: 'victory' as const };
    const blended = blendResults(mResult, tResult, 50);
    expect(blended.wTTK).toBe(1);
    expect(blended.outcome).toBe('victory'); // pure TTK
  });

  it('blendResults: n = 32 is 50% blend', () => {
    const blended = blendResults(
      { phases: [], finalMomentum: 0, outcome: 'retreat' as const },
      { playerTTK: 5, enemyTTK: 5, ttkRatio: 1, outcome: 'retreat' as const },
      32
    );
    expect(blended.wTTK).toBe(0.5);
  });
});

// === Combat Resolver Tests ===

describe('Combat Resolver', () => {
  it('calculateSurvivalScore is bounded 0-100', () => {
    const s1 = calculateSurvivalScore(makeSoldier({ combat: 0, morale: 0, stress: 100, armorNivel: 0 }));
    const s2 = calculateSurvivalScore(makeSoldier({ combat: 100, morale: 100, stress: 0, armorNivel: 4 }));
    expect(s1).toBeGreaterThanOrEqual(0);
    expect(s2).toBeLessThanOrEqual(100);
  });

  it('higher combat/armor = higher survival score', () => {
    const weak = calculateSurvivalScore(makeSoldier({ combat: 20, armorNivel: 1 }));
    const strong = calculateSurvivalScore(makeSoldier({ combat: 90, armorNivel: 4 }));
    expect(strong).toBeGreaterThan(weak);
  });

  it('resolveSoldierOutcomes is deterministic', () => {
    const soldiers = [makeSoldier(), makeSoldier({ soldierId: 'soldier-2' })];
    const phases = [
      { phase: 'engagement' as const, playerDamageDealt: 100, playerDamageTaken: 80, momentumShift: 5, events: [] },
      { phase: 'firefight' as const, playerDamageDealt: 200, playerDamageTaken: 150, momentumShift: 3, events: [] },
      { phase: 'resolution' as const, playerDamageDealt: 80, playerDamageTaken: 40, momentumShift: 2, events: [] },
    ];
    const r1 = resolveSoldierOutcomes(createRng(42), soldiers, phases, true);
    const r2 = resolveSoldierOutcomes(createRng(42), soldiers, phases, true);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});

// === Narrative Generator Tests ===

describe('Narrative Generator', () => {
  it('generates non-empty narrative string', () => {
    const mockResult: CombatResult = {
      contractId: 'c-1',
      phases: [
        { phase: 'engagement', playerDamageDealt: 50, playerDamageTaken: 30, momentumShift: 5, events: ['First contact'] },
        { phase: 'firefight', playerDamageDealt: 120, playerDamageTaken: 80, momentumShift: 10, events: [] },
        { phase: 'resolution', playerDamageDealt: 40, playerDamageTaken: 10, momentumShift: 3, events: ['Enemy retreating'] },
      ],
      outcome: 'victory',
      soldierResults: [{ soldierId: 's-1', damageState: 'light_wound', damageDealt: 100, damageTaken: 40, survivalScore: 60, weaponConditionLoss: 3, armorConditionLoss: 5 }],
      playerCasualties: [],
      playerInjured: ['s-1'],
      enemyCasualtiesEstimate: 12,
      momentumFinal: 45,
      narrative: '',
    };
    const text = generateNarrative(mockResult);
    expect(text.length).toBeGreaterThan(50);
    expect(text).toContain('VITÓRIA');
    expect(text).toContain('Feridos: 1');
  });

  it('defeat narrative contains defeat text', () => {
    const mockResult: CombatResult = {
      contractId: 'c-2',
      phases: [],
      outcome: 'defeat',
      soldierResults: [],
      playerCasualties: ['s-1'],
      playerInjured: [],
      enemyCasualtiesEstimate: 3,
      momentumFinal: -50,
      narrative: '',
    };
    const text = generateNarrative(mockResult);
    expect(text).toContain('DERROTA');
    expect(text).toContain('KIA: 1');
  });
});

// === Full Combat Engine Integration ===

describe('Combat Engine (Integration)', () => {
  it('resolveCombat is deterministic', () => {
    const soldiers = [
      makeSoldier({ soldierId: 's-1' }),
      makeSoldier({ soldierId: 's-2', combat: 70, pfb: 48, cad: 6 }),
    ];
    const r1 = resolveCombat(42, 'contract-1', soldiers, makeFaction(), makeContext());
    const r2 = resolveCombat(42, 'contract-1', soldiers, makeFaction(), makeContext());
    expect(r1.outcome).toBe(r2.outcome);
    expect(r1.momentumFinal).toBe(r2.momentumFinal);
    expect(r1.playerCasualties).toEqual(r2.playerCasualties);
    expect(r1.narrative).toBe(r2.narrative);
  });

  it('resolveCombat returns valid outcome', () => {
    const result = resolveCombat(42, 'c-1', [makeSoldier()], makeFaction(), makeContext());
    expect(['victory', 'defeat', 'retreat']).toContain(result.outcome);
    expect(result.phases).toHaveLength(3);
    expect(result.narrative.length).toBeGreaterThan(0);
    expect(result.soldierResults).toHaveLength(1);
  });

  it('different seeds produce different results', () => {
    const s = [makeSoldier()];
    const r1 = resolveCombat(42, 'c-1', s, makeFaction(), makeContext());
    const r2 = resolveCombat(99, 'c-1', s, makeFaction(), makeContext());
    // At least one field should differ
    const differ = r1.momentumFinal !== r2.momentumFinal || r1.outcome !== r2.outcome;
    expect(differ).toBe(true);
  });
});
