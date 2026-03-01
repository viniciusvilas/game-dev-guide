// Iron Contract — Faction Types (GDD-faithful)

export type FactionType =
  | 'rebel'
  | 'militia'
  | 'cartel'
  | 'government_force'
  | 'rival_pmc';

export interface FactionLeader {
  name: string;
  title: string;
}

export interface Faction {
  id: string;
  name: string;
  type: FactionType;
  leader: FactionLeader;
  territory: string[];       // city IDs controlled
  strength: number;          // 1-100 overall power
  hostility: number;         // 0-100 towards player
  troops: number;            // estimated headcount
  averageLevel: number;      // average soldier quality 1-10
  equipmentMultiplier: number; // mult_equip
  baseStress: number;        // stress base for combat
}
