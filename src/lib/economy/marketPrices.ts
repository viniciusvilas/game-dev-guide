// Iron Contract — Market Prices (GDD v2.0, pure, deterministic)
// Dynamic weapon/armor prices with seed-based weekly variation.

import { createRng } from '@/lib/generators/seededRandom';

// === Base Price Tables (from equipmentTables.ts templates) ===

const WEAPON_BASE_PRICES: Record<string, number> = {
  'Glock 17': 350,
  'MP5': 750,
  'P90': 1000,
  'M4A1': 1250,
  'AK-47': 1000,
  'HK416': 1500,
  'AWM': 2500,
  'M249 SAW': 2750,
  'SPAS-12': 900,
};

const ARMOR_BASE_PRICES: Record<string, number> = {
  'Colete Leve Nível II': 800,
  'Plate Carrier Nível III': 2200,
  'Plate Carrier Reforçado Nível IV': 4500,
};

// === Weekly Variation ===

/**
 * Get weekly price variation multiplier (0.85 — 1.15).
 * Same seed + same week = same multiplier. Deterministic.
 */
function getWeeklyVariation(itemName: string, seed: number, currentDay: number): number {
  const weekIndex = Math.floor(currentDay / 7);
  // Use item name hash to differentiate items within same week
  const nameHash = hashString(itemName);
  const rng = createRng(seed + weekIndex + nameHash);
  return rng.nextFloat(0.85, 1.15);
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// === Public API ===

/**
 * Get current market price for a weapon.
 * Pure and deterministic — same seed + day = same price.
 */
export function getWeaponPrice(weaponName: string, seed: number, currentDay: number): number {
  const base = WEAPON_BASE_PRICES[weaponName];
  if (base === undefined) return 0;
  const variation = getWeeklyVariation(weaponName, seed, currentDay);
  return Math.round(base * variation);
}

/**
 * Get current market price for an armor piece.
 * Pure and deterministic — same seed + day = same price.
 */
export function getArmorPrice(armorName: string, seed: number, currentDay: number): number {
  const base = ARMOR_BASE_PRICES[armorName];
  if (base === undefined) return 0;
  const variation = getWeeklyVariation(armorName, seed, currentDay);
  return Math.round(base * variation);
}

/**
 * Get full market catalog with current prices.
 * Returns all weapons and armors with their current day prices.
 */
export function getMarketCatalog(seed: number, currentDay: number): {
  weapons: { name: string; price: number }[];
  armors: { name: string; price: number }[];
} {
  const weapons = Object.keys(WEAPON_BASE_PRICES).map(name => ({
    name,
    price: getWeaponPrice(name, seed, currentDay),
  }));

  const armors = Object.keys(ARMOR_BASE_PRICES).map(name => ({
    name,
    price: getArmorPrice(name, seed, currentDay),
  }));

  return { weapons, armors };
}

/**
 * Get repair cost for a weapon (15% of current market price).
 */
export function getWeaponRepairCost(weaponName: string, seed: number, currentDay: number): number {
  return Math.round(getWeaponPrice(weaponName, seed, currentDay) * 0.15);
}

/**
 * Get repair cost for an armor (20% of current market price).
 */
export function getArmorRepairCost(armorName: string, seed: number, currentDay: number): number {
  return Math.round(getArmorPrice(armorName, seed, currentDay) * 0.20);
}
