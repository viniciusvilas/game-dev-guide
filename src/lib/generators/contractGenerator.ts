// Iron Contract — Contract Generator (pure, deterministic)

import type { Contract, ContractType } from '@/types/contract';
import type { WorldData } from '@/types/world';
import type { Faction } from '@/types/faction';
import type { GovernmentOfficial } from '@/types/character';
import { createRng } from './seededRandom';

/**
 * Get available contract types based on company level.
 * Higher levels unlock more dangerous/complex mission types.
 */
export function getAvailableContractTypes(companyLevel: number): ContractType[] {
  const types: ContractType[] = ['security', 'continuous_security'];
  if (companyLevel >= 2) types.push('escort');
  if (companyLevel >= 3) types.push('extraction');
  if (companyLevel >= 4) types.push('sabotage');
  if (companyLevel >= 5) types.push('tactical_invasion');
  if (companyLevel >= 7) types.push('reconnaissance');
  if (companyLevel >= 8) types.push('execution');
  if (companyLevel >= 11) types.push('war_support');
  if (companyLevel >= 12) types.push('territory_control');
  return types;
}

const CONTRACT_TITLES: Record<ContractType, string[]> = {
  security: [
    'Secure the Compound', 'Guard the Embassy', 'Patrol Perimeter',
    'Area Denial', 'Defend the Outpost',
  ],
  continuous_security: [
    'Long-Term Security Detail', 'Extended Patrol Contract',
    'Ongoing Facility Protection', 'Permanent Guard Assignment',
  ],
  escort: [
    'VIP Extraction', 'Convoy Escort', 'Diplomat Transport',
    'Supply Route Protection',
  ],
  extraction: [
    'Hostage Rescue', 'Asset Recovery', 'Agent Extraction',
    'Emergency Evacuation',
  ],
  sabotage: [
    'Disable Communications', 'Destroy Supply Cache',
    'Sabotage Infrastructure', 'Demolition Op',
  ],
  tactical_invasion: [
    'Assault on Enemy Camp', 'Raid the Stronghold', 'Capture the Base',
    'Strike Operation', 'Offensive Push', 'Breach and Clear',
    'Territory Seizure', 'Direct Assault', 'Hostile Takeover',
  ],
  reconnaissance: [
    'Scout Enemy Position', 'Intelligence Gathering',
    'Surveillance Operation', 'Recon Patrol',
  ],
  execution: [
    'High-Value Target', 'Elimination Contract',
    'Precision Strike', 'Surgical Operation',
  ],
  war_support: [
    'Artillery Support', 'Forward Operating Base',
    'Combat Logistics', 'Reinforcement Deployment',
  ],
  territory_control: [
    'Sector Takeover', 'Zone Pacification',
    'Regional Dominance', 'Full Territory Control',
  ],
};

const CONTRACT_DESCRIPTIONS: Record<ContractType, string> = {
  security: 'Defend',
  continuous_security: 'Maintain ongoing security in',
  escort: 'Escort and protect assets through',
  extraction: 'Extract target from',
  sabotage: 'Sabotage enemy operations in',
  tactical_invasion: 'Attack',
  reconnaissance: 'Gather intelligence in',
  execution: 'Eliminate high-value target in',
  war_support: 'Provide combat support in',
  territory_control: 'Seize and hold territory in',
};

/**
 * Generate a batch of available contracts for the current game day.
 * Pure and deterministic. Filters by companyLevel.
 */
export function generateContracts(
  seed: number,
  currentDay: number,
  world: WorldData,
  factions: Faction[],
  officials: GovernmentOfficial[],
  count: number,
  companyLevel: number = 1,
): Contract[] {
  const rng = createRng(seed + currentDay);
  const contracts: Contract[] = [];
  const availableTypes = getAvailableContractTypes(companyLevel);
  const maxDangerLevel = Math.min(10, Math.floor(companyLevel * 0.6) + 2);

  // Collect all city IDs
  const allCityIds: string[] = [];
  for (const country of world.countries) {
    for (const region of country.regions) {
      for (const city of region.cities) {
        allCityIds.push(city.id);
      }
    }
  }

  let attempts = 0;
  while (contracts.length < count && attempts < count * 5) {
    attempts++;
    const type = rng.pick(availableTypes);
    const dangerLevel = rng.nextInt(1, 10);
    
    // Filter by max danger level
    if (dangerLevel > maxDangerLevel) continue;

    const baseReward = dangerLevel * rng.nextInt(500, 1500);
    const durationDays = rng.nextInt(1, 5);

    const client = rng.pick(officials);
    const targetFaction = rng.pick(factions);
    const targetCity = rng.pick(allCityIds);

    const titles = CONTRACT_TITLES[type];
    const desc = CONTRACT_DESCRIPTIONS[type] || 'Operations in';

    contracts.push({
      id: `contract-${rng.nextInt(100000, 999999)}`,
      title: rng.pick(titles),
      description: `${desc} operations in ${targetCity}. Danger level: ${dangerLevel}/10.`,
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
