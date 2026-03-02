// Iron Contract — Master Game State (GDD-faithful)

import type { WorldData } from './world';
import type { Soldier } from './soldier';
import type { Weapon, Armor } from './equipment';
import type { Faction } from './faction';
import type { CEO, GovernmentOfficial } from './character';
import type { Company, Difficulty } from './company';
import type { Base } from './base';
import type { Contract, ActiveContract, ContractResult } from './contract';
import type { CompanyFinances } from './economy';
import type { ReputationData } from './reputation';
import type { GameEvent } from './events';

export interface GameState {
  version: string;          // save format version
  seed: number;             // world seed for determinism
  difficulty: Difficulty;
  world: WorldData;
  company: Company;
  ceo: CEO;
  base: Base;
  soldiers: Soldier[];
  weapons: Weapon[];
  armors: Armor[];
  factions: Faction[];
  officials: GovernmentOfficial[];
  availableContracts: Contract[];
  activeContracts: ActiveContract[];
  contractHistory: ContractResult[];
  finances: CompanyFinances;
  reputation: ReputationData;
  events: GameEvent[];
  currentDay: number;
}
