// Iron Contract — Contract Types (GDD-faithful)

export type ContractType =
  | 'security'
  | 'continuous_security'
  | 'escort'
  | 'extraction'
  | 'sabotage'
  | 'tactical_invasion'
  | 'reconnaissance'
  | 'execution'
  | 'war_support'
  | 'territory_control';

export type MissionApproach = 'stealth' | 'frontal' | 'quick';

export interface Contract {
  id: string;
  title: string;
  description: string;
  type: ContractType;
  clientId: string;          // government official or faction
  targetFactionId: string;
  targetCityId: string;
  reward: number;
  penalty: number;           // failure penalty
  durationDays: number;
  dangerLevel: number;       // 1-10
  requiredSoldiers: number;  // minimum squad size
  expiresOnDay: number;
}

export interface ActiveContract {
  contract: Contract;
  assignedSoldierIds: string[];
  approach: MissionApproach;
  startDay: number;
  currentPhase: number;      // combat phase tracker
  completed: boolean;
}

export type ContractResultOutcome = 'victory' | 'defeat' | 'retreat';

export interface ContractResult {
  contractId: string;
  outcome: ContractResultOutcome;
  casualtyIds: string[];
  injuredIds: string[];
  rewardEarned: number;
  reputationChange: number;
  lootWeaponIds: string[];
  day: number;
}
