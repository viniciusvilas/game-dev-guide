// Iron Contract — Contract Generator (pure, deterministic)

import type { Contract, ContractType } from '@/types/contract';
import type { WorldData } from '@/types/world';
import type { Faction } from '@/types/faction';
import type { GovernmentOfficial } from '@/types/character';
import { createRng } from './seededRandom';

const CONTRACT_TYPES: ContractType[] = ['security_local', 'invasion'];

const CONTRACT_TITLES: Record<ContractType, string[]> = {
  security_local: [
    'Secure the Compound', 'Protect the Convoy', 'Guard the Embassy',
    'Patrol Perimeter', 'VIP Extraction', 'Secure Supply Route',
    'Defend the Outpost', 'Escort Mission', 'Area Denial',
  ],
  invasion: [
    'Assault on Enemy Camp', 'Raid the Stronghold', 'Capture the Base',
    'Strike Operation', 'Offensive Push', 'Breach and Clear',
    'Territory Seizure', 'Direct Assault', 'Hostile Takeover',
  ],
};

/**
 * Generate a batch of available contracts for the current game day.
 * Pure and deterministic.
 */
export function generateContracts(
  seed: number,
  currentDay: number,
  world: WorldData,
  factions: Faction[],
  officials: GovernmentOfficial[],
  count: number,
): Contract[] {
  const rng = createRng(seed + currentDay);
  const contracts: Contract[] = [];

  // Collect all city IDs
  const allCityIds: string[] = [];
  for (const country of world.countries) {
    for (const region of country.regions) {
      for (const city of region.cities) {
        allCityIds.push(city.id);
      }
    }
  }

  for (let i = 0; i < count; i++) {
    const type = rng.pick(CONTRACT_TYPES);
    const dangerLevel = rng.nextInt(1, 10);
    const baseReward = dangerLevel * rng.nextInt(500, 1500);
    const durationDays = rng.nextInt(1, 5);

    // Assign a client (official) and target faction
    const client = rng.pick(officials);
    const targetFaction = rng.pick(factions);
    const targetCity = rng.pick(allCityIds);

    contracts.push({
      id: `contract-${rng.nextInt(100000, 999999)}`,
      title: rng.pick(CONTRACT_TITLES[type]),
      description: `${type === 'security_local' ? 'Defend' : 'Attack'} operations in ${targetCity}. Danger level: ${dangerLevel}/10.`,
      type,
      clientId: client.id,
      targetFactionId: targetFaction.id,
      targetCityId: targetCity,
      reward: baseReward,
      penalty: Math.round(baseReward * 0.3),
      durationDays,
      dangerLevel,
      requiredSoldiers: rng.nextInt(2, Math.min(6, 2 + dangerLevel)),
      expiresOnDay: currentDay + rng.nextInt(3, 7),
    });
  }

  return contracts;
}
