// Iron Contract — Event Types (GDD v2.0, sistema de eventos completo)

import type { SoldierStatus } from './soldier';

// === Event Classification ===

export type EventType =
  | 'contract_available'
  | 'contract_completed'
  | 'contract_failed'
  | 'soldier_injured'
  | 'soldier_died'
  | 'soldier_recruited'
  | 'soldier_deserted'
  | 'soldier_breakdown'
  | 'equipment_broken'
  | 'faction_hostility_change'
  | 'faction_weakened'
  | 'base_upgraded'
  | 'financial_warning'
  | 'financial_crisis'
  | 'reputation_milestone'
  | 'story_event'
  | 'random_encounter';

export type EventPriority = 'critical' | 'high' | 'normal' | 'low';

// === Event Effects ===

export interface EventEffect {
  targetType: 'soldier' | 'company' | 'faction' | 'world';
  targetId?: string;
  stressDelta?: number;
  moraleDelta?: number;
  balanceDelta?: number;
  professionalDelta?: number;
  notorietyDelta?: number;
  factionStrengthDelta?: number;
  statusChange?: SoldierStatus;
}

// === Game Event ===

export interface GameEvent {
  id: string;
  type: EventType;
  day: number;
  expiresOnDay: number;
  priority: EventPriority;
  title: string;
  description: string;
  effects: EventEffect[];
  resolved: boolean;
}
