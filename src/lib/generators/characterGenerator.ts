// Iron Contract — Character Generator (GDD v2.0, pure, deterministic)

import type { CEO, GovernmentOfficial } from '@/types/character';
import type { WorldData } from '@/types/world';
import { createRng } from './seededRandom';
import { generateFullName, generateOfficialTitle } from './nameGenerator';

const CEO_SECTORS = [
  'Defense & Security', 'Oil & Energy', 'Mining & Resources',
  'Government Affairs', 'Logistics & Transport', 'Technology',
];

/**
 * Generate the player CEO.
 */
export function generateCEO(seed: number, companyId: string): CEO {
  const rng = createRng(seed);

  return {
    name: generateFullName(rng),
    sector: rng.pick(CEO_SECTORS),
    budget: rng.nextInt(5000, 50000),
    contractQuality: rng.nextInt(1, 5),
    active: true,
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
        influenceLevel: rng.nextInt(10, 80),
        relationWithPlayer: rng.nextInt(-20, 20),
      });
    }
  }

  return officials;
}
