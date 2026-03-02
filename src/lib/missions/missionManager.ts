// Iron Contract — Mission Manager (GDD v2.0, pure, deterministic)
// Orchestrates the full mission flow: context building + combat + resolution.

import type { Contract } from '@/types/contract';
import type { Soldier } from '@/types/soldier';
import type { Weapon, Armor } from '@/types/equipment';
import type { WorldData, City, POIType } from '@/types/world';
import type { ReputationData } from '@/types/reputation';
import type { Faction } from '@/types/faction';
import type { CompanyFinances } from '@/types/economy';
import type {
  MissionCombatContext,
  SoldierCombatInput,
  FactionCombatInput,
  DistanceCategory,
  ShelterLevel,
  IntelLevel,
  CombatResult,
} from '@/types/combat';
import type { MissionApproach } from '@/types/contract';
import type { MissionResult } from '@/types/mission';
import type { GameEvent } from '@/types/events';

import { resolveCombat } from '@/lib/combat/combatEngine';
import { calculateSoldierXP } from '@/lib/progression/xpEngine';
import { canPromote, promote, getSkillsUnlockedAtRank } from '@/lib/progression/rankSystem';
import { calculateMasteryGain } from '@/lib/progression/weaponMasterySystem';
import { createRewardTransaction } from '@/lib/economy/contractRewards';
import { getMasteryLevel } from '@/lib/progression/weaponMasterySystem';

// === Combat Context Builder ===

/** Determine distance based on contract type */
function getDistance(contractType: Contract['type']): DistanceCategory {
  switch (contractType) {
    case 'invasion': return 'long';
    case 'security_local': return 'medium';
    default: return 'medium';
  }
}

/** Determine shelter level based on dominant POI type in target city */
function getShelterFromCity(city: City | undefined): ShelterLevel {
  if (!city || city.pois.length === 0) return 1;

  const poiType = city.pois[0].type;
  return getShelterFromPOI(poiType);
}

function getShelterFromPOI(poi: POIType): ShelterLevel {
  switch (poi) {
    case 'conflict_zone': return 2;
    case 'national_military_base': return 3;
    case 'terrorist_base': return 2;
    case 'private_base': return 2;
    case 'government_area': return 1;
    case 'airport': return 1;
    case 'private_company': return 1;
    case 'vip_residence': return 1;
    case 'transport_hub': return 0;
    default: return 1;
  }
}

/** Determine intel level based on how early the contract was accepted */
function getIntelLevel(contractStartDay: number, contractExpiresOnDay: number, currentDay: number): IntelLevel {
  const daysAdvance = contractExpiresOnDay - currentDay;
  if (daysAdvance >= 7) return 3;
  if (daysAdvance >= 4) return 2;
  if (daysAdvance >= 2) return 1;
  return 0;
}

/** Find a city by ID across all countries/regions */
function findCity(world: WorldData, cityId: string): City | undefined {
  for (const country of world.countries) {
    for (const region of country.regions) {
      const city = region.cities.find(c => c.id === cityId);
      if (city) return city;
    }
  }
  return undefined;
}

/**
 * Build MissionCombatContext from contract and world data.
 */
export function buildCombatContext(
  contract: Contract,
  world: WorldData,
  approach: MissionApproach,
  currentDay: number,
): MissionCombatContext {
  const city = findCity(world, contract.targetCityId);
  return {
    distance: getDistance(contract.type),
    shelter: getShelterFromCity(city),
    intel: getIntelLevel(currentDay, contract.expiresOnDay, currentDay),
    approach,
    timeOfDay: world.timeOfDay,
  };
}

/**
 * Build SoldierCombatInput from a Soldier + their equipped weapon/armor.
 */
export function buildSoldierCombatInput(
  soldier: Soldier,
  weapon: Weapon,
  armor: Armor,
): SoldierCombatInput {
  return {
    soldierId: soldier.id,
    rank: soldier.rank,
    stress: soldier.stress,
    morale: soldier.morale,
    combat: soldier.attributes.combat,
    surveillance: soldier.attributes.surveillance,
    stealth: soldier.attributes.stealth,
    weaponCategory: weapon.category,
    pfb: weapon.pfb,
    cad: weapon.cad,
    pen: weapon.pen,
    silenced: false, // TODO: silencer attachment system
    mtVest: armor.mtVest,
    armorNivel: armor.nivel,
  };
}

/**
 * Build FactionCombatInput from a Faction + contract context.
 */
export function buildFactionCombatInput(
  faction: Faction,
  city: City | undefined,
): FactionCombatInput {
  const shelter = getShelterFromCity(city);
  return {
    factionId: faction.id,
    troops: faction.troops,
    troopLevel: faction.troopLevel,
    equipmentLevel: faction.equipmentLevel,
    equipmentMultiplier: faction.equipmentMultiplier,
    stressBase: faction.stressBase,
    shelterBonus: shelter,
  };
}

/**
 * Execute a full mission: combat → XP → rank → mastery → transactions.
 * Pure function. Does NOT mutate state — returns MissionResult.
 */
export function executeMission(
  seed: number,
  contract: Contract,
  soldiers: Soldier[],
  weapons: Weapon[],
  armors: Armor[],
  faction: Faction,
  world: WorldData,
  reputation: ReputationData,
  approach: MissionApproach,
  currentDay: number,
): MissionResult {
  // 1. Build combat inputs
  const city = findCity(world, contract.targetCityId);
  const context = buildCombatContext(contract, world, approach, currentDay);
  const factionInput = buildFactionCombatInput(faction, city);

  const soldierInputs: SoldierCombatInput[] = soldiers.map(s => {
    const weapon = weapons.find(w => w.id === s.equippedWeaponId)!;
    const armor = armors.find(a => a.id === s.equippedArmorId)!;
    return buildSoldierCombatInput(s, weapon, armor);
  });

  // 2. Resolve combat
  const combatResult = resolveCombat(seed, contract.id, soldierInputs, factionInput, context);

  // 3. Calculate XP per soldier
  const xpGained: Record<string, number> = {};
  for (const sr of combatResult.soldierResults) {
    xpGained[sr.soldierId] = calculateSoldierXP(sr, contract);
  }

  // 4. Check rank promotions
  const rankUps: Record<string, import('@/types/soldier').Rank> = {};
  for (const s of soldiers) {
    const newXP = s.xp + (xpGained[s.id] || 0);
    const newMissions = combatResult.soldierResults.find(r => r.soldierId === s.id)?.damageState !== 'dead'
      ? s.missionsCompleted + 1
      : s.missionsCompleted;
    if (canPromote(s.rank, newXP, newMissions)) {
      rankUps[s.id] = promote(s.rank, newXP, newMissions);
    }
  }

  // 5. Calculate weapon mastery gains
  const masteryGains: Record<string, import('@/types/soldier').WeaponMastery[]> = {};
  for (const s of soldiers) {
    const sr = combatResult.soldierResults.find(r => r.soldierId === s.id);
    if (!sr || sr.damageState === 'dead') continue;

    const weapon = weapons.find(w => w.id === s.equippedWeaponId);
    if (!weapon) continue;

    const gain = calculateMasteryGain(s, weapon.category, 1);
    if (gain > 0) {
      const currentLevel = getMasteryLevel(s, weapon.category);
      masteryGains[s.id] = [{ category: weapon.category, level: currentLevel + gain }];
    }
  }

  // 6. Create financial transactions
  const transactions = [
    createRewardTransaction(contract, combatResult.outcome, reputation, currentDay, currentDay),
  ];

  // 7. Generate events (empty for now — event triggers run separately)
  const eventsGenerated: GameEvent[] = [];

  return {
    contractId: contract.id,
    combatResult,
    xpGained,
    rankUps,
    masteryGains,
    transactions,
    eventsGenerated,
  };
}
