// Iron Contract — Event Types (GDD-faithful)

export type EventType =
  | 'contract_available'
  | 'contract_completed'
  | 'contract_failed'
  | 'soldier_injured'
  | 'soldier_died'
  | 'soldier_recruited'
  | 'equipment_broken'
  | 'faction_hostility_change'
  | 'base_upgraded'
  | 'financial_warning'
  | 'story_event';

export interface GameEvent {
  id: string;
  day: number;
  type: EventType;
  title: string;
  description: string;
  relatedEntityId?: string;
  read: boolean;
}
