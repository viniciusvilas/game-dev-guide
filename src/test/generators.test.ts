import { describe, it, expect } from 'vitest';
import { createRng, hashString } from '@/lib/generators/seededRandom';
import { generateWorld } from '@/lib/generators/worldGenerator';
import { generateStartingRoster } from '@/lib/generators/soldierGenerator';
import { generateWeaponCatalog, generateArmorCatalog } from '@/lib/generators/equipmentTables';
import { generateFactions } from '@/lib/generators/factionGenerator';
import { generateCEO, generateOfficials } from '@/lib/generators/characterGenerator';
import { generateContracts } from '@/lib/generators/contractGenerator';
import type { WorldSeed } from '@/types/world';

const TEST_SEED: WorldSeed = { value: 42, timestamp: 0 };

describe('Seeded PRNG', () => {
  it('produces deterministic sequences', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('different seeds produce different sequences', () => {
    const a = createRng(42);
    const b = createRng(43);
    expect(a.next()).not.toBe(b.next());
  });

  it('hashString is deterministic', () => {
    expect(hashString('IronContract')).toBe(hashString('IronContract'));
  });
});

describe('World Generator', () => {
  it('same seed produces identical worlds', () => {
    const w1 = generateWorld(TEST_SEED);
    const w2 = generateWorld(TEST_SEED);
    expect(JSON.stringify(w1)).toBe(JSON.stringify(w2));
  });

  it('generates exactly 2 countries', () => {
    const w = generateWorld(TEST_SEED);
    expect(w.countries).toHaveLength(2);
  });

  it('each country has regions with cities', () => {
    const w = generateWorld(TEST_SEED);
    for (const country of w.countries) {
      expect(country.regions.length).toBeGreaterThanOrEqual(2);
      for (const region of country.regions) {
        expect(region.cities.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('Soldier Generator', () => {
  it('same seed produces identical roster', () => {
    const r1 = generateStartingRoster(42, 6);
    const r2 = generateStartingRoster(42, 6);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it('soldiers have valid attributes (0-100)', () => {
    const roster = generateStartingRoster(42, 10);
    for (const s of roster) {
      const attrs = Object.values(s.attributes);
      for (const v of attrs) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('Equipment Tables', () => {
  it('same seed produces identical weapons', () => {
    const w1 = generateWeaponCatalog(42);
    const w2 = generateWeaponCatalog(42);
    expect(JSON.stringify(w1)).toBe(JSON.stringify(w2));
  });

  it('generates all weapon categories', () => {
    const weapons = generateWeaponCatalog(42);
    const categories = new Set(weapons.map(w => w.category));
    expect(categories.size).toBeGreaterThanOrEqual(6);
  });

  it('armor catalog is deterministic', () => {
    const a1 = generateArmorCatalog(42);
    const a2 = generateArmorCatalog(42);
    expect(JSON.stringify(a1)).toBe(JSON.stringify(a2));
  });
});

describe('Faction Generator', () => {
  it('same seed produces identical factions', () => {
    const world = generateWorld(TEST_SEED);
    const f1 = generateFactions(42, world, 5);
    const f2 = generateFactions(42, world, 5);
    expect(JSON.stringify(f1)).toBe(JSON.stringify(f2));
  });
});

describe('Contract Generator', () => {
  it('same seed + day produces identical contracts', () => {
    const world = generateWorld(TEST_SEED);
    const factions = generateFactions(42, world, 5);
    const officials = generateOfficials(42, world);
    const c1 = generateContracts(42, 1, world, factions, officials, 3);
    const c2 = generateContracts(42, 1, world, factions, officials, 3);
    expect(JSON.stringify(c1)).toBe(JSON.stringify(c2));
  });

  it('different days produce different contracts', () => {
    const world = generateWorld(TEST_SEED);
    const factions = generateFactions(42, world, 5);
    const officials = generateOfficials(42, world);
    const c1 = generateContracts(42, 1, world, factions, officials, 3);
    const c2 = generateContracts(42, 2, world, factions, officials, 3);
    expect(JSON.stringify(c1)).not.toBe(JSON.stringify(c2));
  });
});
