// Iron Contract — Faction Types (GDD v2.0)

export type FactionType =
  | 'national_army'
  | 'terrorist'
  | 'criminal';

export interface FactionLeader {
  name: string;
  title: string;
}

export interface Faction {
  id: string;
  name: string;
  type: FactionType;
  leader: FactionLeader;
  territory: string[];         // city IDs controlled
  militaryPower: number;       // 1-100 overall power
  stressBase: number;          // 0.60-1.40 stress base for combat
  troops: number;              // estimated headcount
  troopLevel: number;          // 1-5 average soldier quality
  equipmentLevel: number;      // 1-5 equipment quality
  equipmentMultiplier: number; // mult_equip
}
