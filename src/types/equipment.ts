// Iron Contract — Equipment Types (GDD v2.0)

import type { WeaponCategory } from './soldier';

export type WeaponCondition = 'new' | 'good' | 'worn' | 'damaged' | 'broken';

export type ArmorType = 'light' | 'medium' | 'heavy';

export interface Weapon {
  id: string;
  name: string;
  category: WeaponCategory;
  pfb: number;            // Poder de Fogo Base
  cad: number;            // Cadência 1-10
  pen: number;            // Penetração de munição
  silenciavel: boolean;   // pode receber silenciador
  condition: WeaponCondition;
  conditionPercent: number; // 0-100, degrades with use
  price: number;
  repairCost: number;
}

export interface Armor {
  id: string;
  name: string;
  type: ArmorType;
  mtVest: number;         // 0.00-0.88, mitigação do colete
  nivel: number;          // 0-4, nível de proteção
  condition: WeaponCondition;
  conditionPercent: number;
  price: number;
  repairCost: number;
}
