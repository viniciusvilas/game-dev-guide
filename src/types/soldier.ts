// Iron Contract — Soldier Types (GDD v2.0)
// HP is NOT a stored field — it's computed by the combat engine:
// HP_efetivo = 100 / (1 - MT_vest)

export type SoldierStatus =
  | 'available'
  | 'on_mission'
  | 'injured'
  | 'severely_injured'
  | 'unconscious'
  | 'dead'
  | 'in_training'
  | 'on_leave';

export type Rank =
  | 'recruit'
  | 'operator'
  | 'corporal'
  | 'sergeant'
  | 'sergeant_major'
  | 'lieutenant'
  | 'captain'
  | 'major';

export interface SoldierAttributes {
  combat: number;        // 0-100
  surveillance: number;  // 0-100
  stealth: number;       // 0-100
  driving: number;       // 0-100
  medicine: number;      // 0-100
  logistics: number;     // 0-100
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
  stress: number;       // 0-100
  morale: number;       // 0-100
  salary: number;       // daily cost
  equippedWeaponId: string | null;
  equippedArmorId: string | null;
  xp: number;
  missionsCompleted: number;
  daysInService: number;
}
