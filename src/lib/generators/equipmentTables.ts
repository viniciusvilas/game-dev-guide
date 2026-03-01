// Iron Contract — Equipment Tables (pure, deterministic)
// Generates weapon and armor catalogs from seed.

import type { Weapon, Armor, ArmorType } from '@/types/equipment';
import type { WeaponCategory } from '@/types/soldier';
import type { SeededRng } from './seededRandom';
import { createRng } from './seededRandom';

interface WeaponTemplate {
  name: string;
  category: WeaponCategory;
  damage: [number, number];     // [min, max]
  fireRate: [number, number];
  accuracy: [number, number];
  range: [number, number];
  price: [number, number];
}

const WEAPON_TEMPLATES: WeaponTemplate[] = [
  // Pistols
  { name: 'M9 Beretta', category: 'pistol', damage: [15, 20], fireRate: [2, 3], accuracy: [55, 70], range: [20, 30], price: [200, 400] },
  { name: 'Glock 17', category: 'pistol', damage: [14, 18], fireRate: [3, 4], accuracy: [60, 75], range: [20, 28], price: [250, 450] },
  { name: 'Desert Eagle', category: 'pistol', damage: [25, 35], fireRate: [1, 2], accuracy: [45, 60], range: [15, 25], price: [500, 800] },
  // SMGs
  { name: 'MP5', category: 'smg', damage: [12, 16], fireRate: [5, 7], accuracy: [50, 65], range: [30, 45], price: [600, 900] },
  { name: 'UZI', category: 'smg', damage: [10, 14], fireRate: [6, 8], accuracy: [40, 55], range: [25, 40], price: [400, 700] },
  { name: 'P90', category: 'smg', damage: [13, 17], fireRate: [6, 8], accuracy: [55, 68], range: [35, 50], price: [800, 1200] },
  // Assault Rifles
  { name: 'AK-47', category: 'assault_rifle', damage: [22, 30], fireRate: [3, 5], accuracy: [50, 65], range: [50, 70], price: [800, 1200] },
  { name: 'M4A1', category: 'assault_rifle', damage: [20, 28], fireRate: [4, 5], accuracy: [60, 75], range: [55, 75], price: [1000, 1500] },
  { name: 'FAMAS', category: 'assault_rifle', damage: [21, 27], fireRate: [4, 6], accuracy: [55, 70], range: [50, 68], price: [900, 1400] },
  // Precision Rifles
  { name: 'SVD Dragunov', category: 'precision_rifle', damage: [35, 50], fireRate: [1, 2], accuracy: [70, 90], range: [80, 100], price: [1500, 2500] },
  { name: 'M24 SWS', category: 'precision_rifle', damage: [40, 55], fireRate: [1, 1], accuracy: [75, 92], range: [85, 100], price: [2000, 3000] },
  // Shotguns
  { name: 'Remington 870', category: 'shotgun', damage: [30, 45], fireRate: [1, 2], accuracy: [60, 75], range: [10, 20], price: [500, 800] },
  { name: 'SPAS-12', category: 'shotgun', damage: [35, 50], fireRate: [1, 2], accuracy: [55, 70], range: [10, 18], price: [700, 1100] },
  // Machine Guns
  { name: 'M249 SAW', category: 'machine_gun', damage: [18, 25], fireRate: [8, 12], accuracy: [35, 50], range: [60, 80], price: [2000, 3500] },
  { name: 'PKM', category: 'machine_gun', damage: [20, 28], fireRate: [7, 10], accuracy: [30, 48], range: [55, 75], price: [1800, 3000] },
];

interface ArmorTemplate {
  name: string;
  type: ArmorType;
  defense: [number, number];
  mobilityPenalty: [number, number]; // 0-1
  price: [number, number];
}

const ARMOR_TEMPLATES: ArmorTemplate[] = [
  { name: 'Tactical Vest', type: 'light', defense: [5, 10], mobilityPenalty: [0.02, 0.08], price: [200, 400] },
  { name: 'Kevlar Jacket', type: 'light', defense: [8, 15], mobilityPenalty: [0.05, 0.12], price: [350, 600] },
  { name: 'Assault Carrier', type: 'medium', defense: [15, 25], mobilityPenalty: [0.10, 0.20], price: [600, 1000] },
  { name: 'Ceramic Plate Carrier', type: 'medium', defense: [20, 30], mobilityPenalty: [0.15, 0.25], price: [800, 1400] },
  { name: 'Heavy Ballistic Armor', type: 'heavy', defense: [30, 45], mobilityPenalty: [0.25, 0.40], price: [1500, 2500] },
  { name: 'EOD Suit', type: 'heavy', defense: [40, 55], mobilityPenalty: [0.35, 0.50], price: [2500, 4000] },
];

function generateWeapon(rng: SeededRng, template: WeaponTemplate): Weapon {
  const price = rng.nextInt(template.price[0], template.price[1]);
  return {
    id: `weapon-${rng.nextInt(100000, 999999)}`,
    name: template.name,
    category: template.category,
    damage: rng.nextInt(template.damage[0], template.damage[1]),
    fireRate: rng.nextInt(template.fireRate[0], template.fireRate[1]),
    accuracy: rng.nextInt(template.accuracy[0], template.accuracy[1]),
    range: rng.nextInt(template.range[0], template.range[1]),
    condition: 'new',
    conditionPercent: 100,
    price,
    repairCost: Math.round(price * 0.15),
  };
}

function generateArmor(rng: SeededRng, template: ArmorTemplate): Armor {
  const price = rng.nextInt(template.price[0], template.price[1]);
  return {
    id: `armor-${rng.nextInt(100000, 999999)}`,
    name: template.name,
    type: template.type,
    defense: rng.nextInt(template.defense[0], template.defense[1]),
    mobilityPenalty: rng.nextFloat(template.mobilityPenalty[0], template.mobilityPenalty[1]),
    condition: 'new',
    conditionPercent: 100,
    price,
    repairCost: Math.round(price * 0.2),
  };
}

/**
 * Generate the starting weapon catalog.
 * Pure and deterministic — same seed, same weapons.
 */
export function generateWeaponCatalog(seed: number): Weapon[] {
  const rng = createRng(seed);
  return WEAPON_TEMPLATES.map(t => generateWeapon(rng, t));
}

/**
 * Generate the starting armor catalog.
 */
export function generateArmorCatalog(seed: number): Armor[] {
  const rng = createRng(seed);
  return ARMOR_TEMPLATES.map(t => generateArmor(rng, t));
}
