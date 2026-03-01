// Iron Contract — Combat Types (GDD v2.0, motor de combate)

import type { Rank, WeaponCategory } from './soldier';
import type { MissionApproach } from './contract';

// === Enums / Unions ===

export type CombatPhase = 'engagement' | 'firefight' | 'resolution';

export type DamageState = 'healthy' | 'light_wound' | 'heavy_wound' | 'critical' | 'dead';

export type DistanceCategory = 'close' | 'medium' | 'long';

export type ShelterLevel = 0 | 1 | 2 | 3; // 0=none, 3=heavy cover

export type IntelLevel = 0 | 1 | 2 | 3;   // 0=blind, 3=full intel

export type TimeOfDay = 'day' | 'night';

// === Combat Motor Input Types ===

/** Snapshot of a soldier's combat-ready stats at mission start */
export interface SoldierCombatInput {
  soldierId: string;
  rank: Rank;
  stress: number;             // 0-100
  morale: number;             // 0-100
  combat: number;             // attribute 0-100
  surveillance: number;       // attribute 0-100
  stealth: number;            // attribute 0-100
  // Equipped weapon stats
  weaponCategory: WeaponCategory;
  pfb: number;                // Poder de Fogo Base
  cad: number;                // Cadência 1-10
  pen: number;                // Penetração de munição
  silenced: boolean;          // silenciador equipado
  // Equipped armor stats
  mtVest: number;             // 0.00-0.88 mitigação do colete
  armorNivel: number;         // 0-4 nível de proteção
}

/** NPC faction data fed into the combat engine */
export interface FactionCombatInput {
  factionId: string;
  troops: number;             // headcount in this engagement
  troopLevel: number;         // 1-5
  equipmentLevel: number;     // 1-5
  equipmentMultiplier: number; // mult_equip (derived from equipmentLevel)
  stressBase: number;         // 0.60-1.40
  shelterBonus: number;       // M_abrigo from location (0-3)
}

/** Mission-level context for the combat resolver */
export interface MissionCombatContext {
  distance: DistanceCategory;
  shelter: ShelterLevel;
  intel: IntelLevel;
  approach: MissionApproach;
  timeOfDay: TimeOfDay;
}

// === Combat Results ===

export interface SoldierCombatResult {
  soldierId: string;
  damageState: DamageState;
  damageDealt: number;
  damageTaken: number;
  survivalScore: number;
  weaponConditionLoss: number;  // % degradation
  armorConditionLoss: number;   // % degradation
}

export interface CombatPhaseResult {
  phase: CombatPhase;
  playerDamageDealt: number;
  playerDamageTaken: number;
  momentumShift: number;
  events: string[];
}

export interface MomentumResult {
  phases: CombatPhaseResult[];
  finalMomentum: number;        // -100 to 100
  outcome: 'victory' | 'defeat' | 'retreat';
}

export interface TTKResult {
  playerTTK: number;            // turns to kill enemy force
  enemyTTK: number;             // turns to kill player force
  ttkRatio: number;             // playerTTK / enemyTTK
  outcome: 'victory' | 'defeat' | 'retreat';
}

export interface CombatResult {
  contractId: string;
  phases: CombatPhaseResult[];
  outcome: 'victory' | 'defeat' | 'retreat';
  soldierResults: SoldierCombatResult[];
  playerCasualties: string[];   // soldier IDs killed
  playerInjured: string[];      // soldier IDs wounded
  enemyCasualtiesEstimate: number;
  momentumFinal: number;        // -100 to 100
  narrative: string;
}
