// Iron Contract — Faction Generator (GDD v2.0, pure, deterministic)

import type { Faction, FactionType } from '@/types/faction';
import type { WorldData } from '@/types/world';
import type { SeededRng } from './seededRandom';
import { createRng } from './seededRandom';
import { generateFactionName, generateFullName } from './nameGenerator';

const FACTION_TYPES: FactionType[] = ['national_army', 'terrorist', 'criminal'];

/** GDD v2.0 — equipmentLevel → equipmentMultiplier deterministic mapping */
export function equipmentLevelToMultiplier(level: number): number {
  const table: Record<number, number> = { 1: 0.60, 2: 0.80, 3: 1.00, 4: 1.20, 5: 1.40 };
  return table[level] ?? 1.00;
}

/**
 * Generate factions and assign them to cities in the world.
 * Pure and deterministic.
 */
export function generateFactions(seed: number, world: WorldData, count: number): Faction[] {
  const rng = createRng(seed);
  const factions: Faction[] = [];

  const allCityIds: string[] = [];
  for (const country of world.countries) {
    for (const region of country.regions) {
      for (const city of region.cities) {
        allCityIds.push(city.id);
      }
    }
  }

  const shuffledCities = rng.shuffle(allCityIds);

  for (let i = 0; i < count; i++) {
    const type = rng.pick(FACTION_TYPES);
    const territoryCount = rng.nextInt(1, Math.min(3, shuffledCities.length));
    const startIdx = i * 3;
    const territory = shuffledCities.slice(startIdx, startIdx + territoryCount);
    const equipmentLevel = rng.nextInt(1, 5);

    const faction: Faction = {
      id: `faction-${rng.nextInt(100000, 999999)}`,
      name: generateFactionName(rng),
      type,
      leader: {
        name: generateFullName(rng),
        title: type === 'criminal' ? 'Cartel Boss'
          : type === 'terrorist' ? 'Cell Commander'
          : 'General',
      },
      territory,
      militaryPower: rng.nextInt(20, 80),
      stressBase: rng.nextFloat(0.60, 1.40),
      troops: rng.nextInt(50, 500),
      troopLevel: rng.nextInt(1, 5),
      equipmentLevel,
      equipmentMultiplier: equipmentLevelToMultiplier(equipmentLevel),
    };

    factions.push(faction);
  }

  return factions;
}
