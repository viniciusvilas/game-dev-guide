// Iron Contract — Soldier Generator (GDD v2.0, pure, deterministic)
// HP is NOT stored on soldier — it's computed dynamically by the combat engine:
// HP_efetivo = 100 / (1 - MT_vest)

import type { Soldier, SoldierAttributes, Rank, WeaponMastery, WeaponCategory, SoldierSkill } from '@/types/soldier';
import type { SeededRng } from './seededRandom';
import { createRng } from './seededRandom';
import { generateFullName } from './nameGenerator';

const ALL_WEAPON_CATEGORIES: WeaponCategory[] = [
  'pistol', 'smg', 'assault_rifle', 'precision_rifle', 'shotgun', 'machine_gun',
];

const ALL_SKILLS: SoldierSkill[] = [
  'medic', 'demolitions', 'sniper', 'scout', 'heavy_weapons', 'communications',
];

const STARTING_RANKS: Rank[] = ['recruit', 'operator', 'corporal'];

function generateAttributes(rng: SeededRng, quality: number): SoldierAttributes {
  // quality 1-10 influences attribute ranges
  const base = quality * 8;
  const variance = 15;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  return {
    combat: clamp(rng.nextInt(base - variance, base + variance)),
    surveillance: clamp(rng.nextInt(base - variance, base + variance)),
    stealth: clamp(rng.nextInt(base - variance, base + variance)),
    driving: clamp(rng.nextInt(base - variance, base + variance)),
    medicine: clamp(rng.nextInt(base - variance, base + variance)),
    logistics: clamp(rng.nextInt(base - variance, base + variance)),
  };
}

function generateWeaponMasteries(rng: SeededRng): WeaponMastery[] {
  const count = rng.nextInt(1, 3);
  const categories = rng.shuffle(ALL_WEAPON_CATEGORIES).slice(0, count);
  return categories.map(category => ({
    category,
    level: rng.nextInt(10, 60),
  }));
}

function generateSkills(rng: SeededRng): SoldierSkill[] {
  const count = rng.nextInt(0, 2);
  return rng.shuffle(ALL_SKILLS).slice(0, count);
}

/**
 * Generate a single soldier. Pure and deterministic.
 * @param seed - numeric seed for this soldier
 * @param quality - 1-10, affects stat distribution
 */
export function generateSoldier(seed: number, quality: number = 3): Soldier {
  const rng = createRng(seed);
  const rank = rng.pick(STARTING_RANKS);

  return {
    id: `soldier-${rng.nextInt(100000, 999999)}`,
    name: generateFullName(rng),
    rank,
    status: 'available',
    attributes: generateAttributes(rng, quality),
    weaponMasteries: generateWeaponMasteries(rng),
    skills: generateSkills(rng),
    stress: rng.nextInt(0, 20),
    morale: rng.nextInt(50, 80),
    salary: rng.nextInt(50, 150),
    equippedWeaponId: null,
    equippedArmorId: null,
    xp: 0,
    missionsCompleted: 0,
    daysInService: 0,
  };
}

/**
 * Generate a roster of starting soldiers.
 * @param baseSeed - world seed to derive soldier seeds
 * @param count - number of soldiers to generate
 */
export function generateStartingRoster(baseSeed: number, count: number): Soldier[] {
  const rng = createRng(baseSeed);
  const soldiers: Soldier[] = [];
  for (let i = 0; i < count; i++) {
    const soldierSeed = rng.nextInt(0, 2147483647);
    const quality = rng.nextInt(2, 5);
    soldiers.push(generateSoldier(soldierSeed, quality));
  }
  return soldiers;
}
