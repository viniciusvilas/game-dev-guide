// Iron Contract — Faction Generator (pure, deterministic)

import type { Faction, FactionType } from '@/types/faction';
import type { WorldData } from '@/types/world';
import type { SeededRng } from './seededRandom';
import { createRng } from './seededRandom';
import { generateFactionName, generateFullName } from './nameGenerator';

const FACTION_TYPES: FactionType[] = [
  'rebel', 'militia', 'cartel', 'government_force', 'rival_pmc',
];

/**
 * Generate factions and assign them to cities in the world.
 * Pure and deterministic.
 */
export function generateFactions(seed: number, world: WorldData, count: number): Faction[] {
  const rng = createRng(seed);
  const factions: Faction[] = [];

  // Collect all city IDs for territory assignment
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
    // Assign 1-3 cities as territory
    const territoryCount = rng.nextInt(1, Math.min(3, shuffledCities.length));
    const startIdx = i * 3;
    const territory = shuffledCities.slice(startIdx, startIdx + territoryCount);

    const faction: Faction = {
      id: `faction-${rng.nextInt(100000, 999999)}`,
      name: generateFactionName(rng),
      type,
      leader: {
        name: generateFullName(rng),
        title: type === 'cartel' ? 'Cartel Boss'
          : type === 'rebel' ? 'Revolutionary Leader'
          : type === 'government_force' ? 'General'
          : type === 'rival_pmc' ? 'CEO'
          : 'Warlord',
      },
      territory,
      strength: rng.nextInt(20, 80),
      hostility: rng.nextInt(10, 70),
      troops: rng.nextInt(50, 500),
      averageLevel: rng.nextInt(2, 8),
      equipmentMultiplier: rng.nextFloat(0.5, 1.5),
      baseStress: rng.nextInt(10, 50),
    };

    factions.push(faction);
  }

  return factions;
}
