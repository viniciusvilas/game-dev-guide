// Iron Contract — Character Generator (pure, deterministic)

import type { CEO, GovernmentOfficial } from '@/types/character';
import type { WorldData } from '@/types/world';
import { createRng } from './seededRandom';
import { generateFullName, generateOfficialTitle } from './nameGenerator';

/**
 * Generate the player CEO.
 */
export function generateCEO(seed: number, companyId: string): CEO {
  const rng = createRng(seed);
  const backgrounds = [
    'Ex-Special Forces', 'Former Intelligence Officer', 'Military Strategist',
    'Corporate Security Expert', 'War Correspondent', 'Retired Colonel',
  ];

  return {
    name: generateFullName(rng),
    background: rng.pick(backgrounds),
    reputation: 50,
    companyId,
  };
}

/**
 * Generate government officials for each country.
 * Pure and deterministic.
 */
export function generateOfficials(seed: number, world: WorldData): GovernmentOfficial[] {
  const rng = createRng(seed);
  const officials: GovernmentOfficial[] = [];

  for (const country of world.countries) {
    const count = rng.nextInt(2, 4);
    for (let i = 0; i < count; i++) {
      officials.push({
        id: `official-${rng.nextInt(100000, 999999)}`,
        name: generateFullName(rng),
        title: generateOfficialTitle(rng),
        countryId: country.id,
        corruptionLevel: rng.nextInt(10, 80),
        relationWithPlayer: rng.nextInt(-20, 20),
      });
    }
  }

  return officials;
}
