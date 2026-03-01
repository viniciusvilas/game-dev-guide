// Iron Contract — Equipment Types (GDD-faithful)

import type { WeaponCategory } from './soldier';

export type WeaponCondition = 'new' | 'good' | 'worn' | 'damaged' | 'broken';

export type ArmorType = 'light' | 'medium' | 'heavy';

export interface Weapon {
  id: string;
  name: string;
  category: WeaponCategory;
  damage: number;
  fireRate: number;       // rounds per turn
  accuracy: number;       // 0-100
  range: number;          // effective range modifier
  condition: WeaponCondition;
  conditionPercent: number; // 0-100, degrades with use
  price: number;
  repairCost: number;
}

export interface Armor {
  id: string;
  name: string;
  type: ArmorType;
  defense: number;        // damage reduction
  mobilityPenalty: number; // 0-1 multiplier
  condition: WeaponCondition;
  conditionPercent: number;
  price: number;
  repairCost: number;
}
