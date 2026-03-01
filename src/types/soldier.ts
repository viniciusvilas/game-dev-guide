// Iron Contract — Soldier Types (GDD-faithful)

export type SoldierStatus = 'available' | 'deployed' | 'injured' | 'dead' | 'resting';

export type Rank =
  | 'recruit'      // Recruta
  | 'soldier'      // Soldado
  | 'veteran'      // Veterano
  | 'elite'        // Elite
  | 'commander';   // Comandante

export interface SoldierAttributes {
  combat: number;       // 1-100
  precision: number;    // 1-100
  tactics: number;      // 1-100
  endurance: number;    // 1-100
  stealth: number;      // 1-100
  leadership: number;   // 1-100
}

export type WeaponCategory =
  | 'pistol'
  | 'smg'
  | 'assault_rifle'
  | 'precision_rifle'
  | 'shotgun'
  | 'machine_gun';

export interface WeaponMastery {
  category: WeaponCategory;
  level: number; // 0-100
}

export type SoldierSkill =
  | 'medic'
  | 'demolitions'
  | 'sniper'
  | 'scout'
  | 'heavy_weapons'
  | 'communications';

export interface Soldier {
  id: string;
  name: string;
  rank: Rank;
  status: SoldierStatus;
  attributes: SoldierAttributes;
  weaponMasteries: WeaponMastery[];
  skills: SoldierSkill[];
  hp: number;          // current HP
  hpMax: number;       // max HP
  stress: number;      // 0-100
  morale: number;      // 0-100
  salary: number;      // daily cost
  equippedWeaponId: string | null;
  equippedArmorId: string | null;
  xp: number;
  missionsCompleted: number;
  daysInService: number;
}
