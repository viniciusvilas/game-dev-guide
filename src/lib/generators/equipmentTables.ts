// Iron Contract — Equipment Tables (GDD v2.0, pure, deterministic)

import type { Weapon, Armor, ArmorType } from '@/types/equipment';
import type { WeaponCategory } from '@/types/soldier';
import type { SeededRng } from './seededRandom';
import { createRng } from './seededRandom';

interface WeaponTemplate {
  name: string;
  category: WeaponCategory;
  pfb: number;
  cad: number;
  pen: number;
  silenciavel: boolean;
  price: [number, number];
}

// Valores exatos do GDD v2.0
const WEAPON_TEMPLATES: WeaponTemplate[] = [
  { name: 'Glock 17', category: 'pistol', pfb: 18, cad: 4, pen: 0.6, silenciavel: true, price: [250, 450] },
  { name: 'MP5', category: 'smg', pfb: 28, cad: 8, pen: 0.8, silenciavel: true, price: [600, 900] },
  { name: 'P90', category: 'smg', pfb: 30, cad: 9, pen: 1.2, silenciavel: true, price: [800, 1200] },
  { name: 'M4A1', category: 'assault_rifle', pfb: 45, cad: 7, pen: 3.2, silenciavel: true, price: [1000, 1500] },
  { name: 'AK-47', category: 'assault_rifle', pfb: 48, cad: 6, pen: 3.0, silenciavel: false, price: [800, 1200] },
  { name: 'HK416', category: 'assault_rifle', pfb: 47, cad: 7, pen: 3.4, silenciavel: true, price: [1200, 1800] },
  { name: 'AWM', category: 'precision_rifle', pfb: 85, cad: 1, pen: 6.0, silenciavel: true, price: [2000, 3000] },
  { name: 'M249 SAW', category: 'machine_gun', pfb: 55, cad: 10, pen: 3.0, silenciavel: false, price: [2000, 3500] },
  { name: 'SPAS-12', category: 'shotgun', pfb: 60, cad: 2, pen: 1.5, silenciavel: false, price: [700, 1100] },
];

interface ArmorTemplate {
  name: string;
  type: ArmorType;
  mtVest: number;
  nivel: number;
  price: number;
}

// Valores exatos do GDD v2.0
const ARMOR_TEMPLATES: ArmorTemplate[] = [
  { name: 'Colete Leve Nível II', type: 'light', mtVest: 0.45, nivel: 2, price: 800 },
  { name: 'Plate Carrier Nível III', type: 'medium', mtVest: 0.72, nivel: 3, price: 2200 },
  { name: 'Plate Carrier Reforçado Nível IV', type: 'heavy', mtVest: 0.88, nivel: 4, price: 4500 },
];

function generateWeapon(rng: SeededRng, template: WeaponTemplate): Weapon {
  const price = rng.nextInt(template.price[0], template.price[1]);
  return {
    id: `weapon-${rng.nextInt(100000, 999999)}`,
    name: template.name,
    category: template.category,
    pfb: template.pfb,
    cad: template.cad,
    pen: template.pen,
    silenciavel: template.silenciavel,
    condition: 100,
    price,
    repairCost: Math.round(price * 0.15),
  };
}

function generateArmor(rng: SeededRng, template: ArmorTemplate): Armor {
  return {
    id: `armor-${rng.nextInt(100000, 999999)}`,
    name: template.name,
    type: template.type,
    mtVest: template.mtVest,
    nivel: template.nivel,
    condition: 100,
    price: template.price,
    repairCost: Math.round(template.price * 0.2),
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
