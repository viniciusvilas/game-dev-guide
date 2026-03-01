// Iron Contract — Combat Types (GDD-faithful)

import type { Rank, WeaponCategory } from './soldier';

// === Enums / Unions ===

export type CombatPhase = 'engagement' | 'firefight' | 'resolution';

export type DamageState = 'healthy' | 'light_wound' | 'heavy_wound' | 'critical' | 'dead';

export type DistanceCategory = 'close' | 'medium' | 'long';

export type ShelterLevel = 0 | 1 | 2 | 3; // 0=none, 3=heavy cover

export type IntelLevel = 0 | 1 | 2 | 3;   // 0=blind, 3=full intel

export type TimeOfDay = 'day' | 'night';

// === Combat Motor Input Types (Etapa 3 params) ===

/** Snapshot of a soldier's combat-ready stats at mission start */
export interface SoldierCombatInput {
  soldierId: string;
  ps: number;               // Power Score
  dps: number;              // Damage Per Second (calculated)
  hpEffective: number;      // HP after armor/endurance modifiers
  stress: number;           // 0-100
  rank: Rank;
  equippedWeaponCategory: WeaponCategory;
  equippedWeaponDamage: number;
  equippedWeaponAccuracy: number;
  equippedArmorDefense: number;
  equippedArmorMobilityPenalty: number;
}

/** NPC faction data fed into the combat engine */
export interface FactionCombatInput {
  factionId: string;
  troops: number;            // headcount in this engagement
  averageLevel: number;      // 1-10
  equipmentMultiplier: number; // mult_equip
  baseStress: number;        // stress base
  shelterBonus: number;      // M_abrigo from location
}

/** Mission-level context for the combat resolver */
export interface MissionCombatContext {
  distance: DistanceCategory;
  shelter: ShelterLevel;
  intel: IntelLevel;
  approach: import('./contract').MissionApproach;
  timeOfDay: TimeOfDay;
}

// === Combat Results ===

export interface CombatResult {
  contractId: string;
  phases: CombatPhaseResult[];
  outcome: 'victory' | 'defeat' | 'retreat';
  playerCasualties: string[];   // soldier IDs killed
  playerInjured: string[];      // soldier IDs wounded
  enemyCasualtiesEstimate: number;
  momentumFinal: number;        // -100 to 100
}

export interface CombatPhaseResult {
  phase: CombatPhase;
  playerDamageDealt: number;
  playerDamageTaken: number;
  momentumShift: number;
  events: string[];             // narrative events
}
