// Iron Contract — Event Processor (GDD v2.0, pure, deterministic)
// Applies event effects to game systems. All functions are pure.

import type { Soldier } from '@/types/soldier';
import type { CompanyFinances } from '@/types/economy';
import type { ReputationData } from '@/types/reputation';
import type { Faction } from '@/types/faction';
import type { GameEvent, EventEffect } from '@/types/events';

// === Effect Application ===

/** Apply a single effect to a soldier. Returns updated soldier or original if not targeted. */
function applySoldierEffect(soldier: Soldier, effect: EventEffect): Soldier {
  if (effect.targetType !== 'soldier') return soldier;
  // If targetId specified, only apply to that soldier
  if (effect.targetId && effect.targetId !== soldier.id) return soldier;

  let updated = { ...soldier };

  if (effect.stressDelta !== undefined) {
    updated.stress = clamp(updated.stress + effect.stressDelta, 0, 100);
  }
  if (effect.moraleDelta !== undefined) {
    updated.morale = clamp(updated.morale + effect.moraleDelta, 0, 100);
  }
  if (effect.statusChange !== undefined) {
    updated.status = effect.statusChange;
  }

  return updated;
}

/** Apply effects to all soldiers. Returns new array. */
export function applyEffectsToSoldiers(
  soldiers: Soldier[],
  effects: EventEffect[]
): Soldier[] {
  const soldierEffects = effects.filter(e => e.targetType === 'soldier');
  if (soldierEffects.length === 0) return soldiers;

  return soldiers.map(s => {
    let updated = s;
    for (const effect of soldierEffects) {
      updated = applySoldierEffect(updated, effect);
    }
    return updated;
  });
}

/** Apply financial effects. Returns updated finances. */
export function applyEffectsToFinances(
  finances: CompanyFinances,
  effects: EventEffect[]
): CompanyFinances {
  const companyEffects = effects.filter(
    e => e.targetType === 'company' && e.balanceDelta !== undefined
  );
  if (companyEffects.length === 0) return finances;

  const totalDelta = companyEffects.reduce((sum, e) => sum + (e.balanceDelta ?? 0), 0);

  return {
    ...finances,
    balance: finances.balance + totalDelta,
  };
}

/** Apply reputation effects. Returns updated reputation. */
export function applyEffectsToReputation(
  reputation: ReputationData,
  effects: EventEffect[]
): ReputationData {
  const repEffects = effects.filter(
    e => e.targetType === 'company' &&
      (e.professionalDelta !== undefined || e.notorietyDelta !== undefined)
  );
  if (repEffects.length === 0) return reputation;

  let profDelta = 0;
  let notDelta = 0;
  for (const e of repEffects) {
    profDelta += e.professionalDelta ?? 0;
    notDelta += e.notorietyDelta ?? 0;
  }

  return {
    ...reputation,
    professional: clamp(reputation.professional + profDelta, 0, 100),
    notoriety: clamp(reputation.notoriety + notDelta, 0, 100),
    ceoReputation: [...reputation.ceoReputation],
    byCountry: [...reputation.byCountry],
  };
}

/** Apply faction effects. Returns updated factions array. */
export function applyEffectsToFactions(
  factions: Faction[],
  effects: EventEffect[]
): Faction[] {
  const factionEffects = effects.filter(
    e => e.targetType === 'faction' && e.factionStrengthDelta !== undefined
  );
  if (factionEffects.length === 0) return factions;

  return factions.map(f => {
    const applicable = factionEffects.filter(
      e => !e.targetId || e.targetId === f.id
    );
    if (applicable.length === 0) return f;

    const totalDelta = applicable.reduce((sum, e) => sum + (e.factionStrengthDelta ?? 0), 0);
    return {
      ...f,
      militaryPower: clamp(f.militaryPower + totalDelta, 0, 100),
    };
  });
}

// === Process Full Event ===

export interface EventProcessResult {
  soldiers: Soldier[];
  finances: CompanyFinances;
  reputation: ReputationData;
  factions: Faction[];
  event: GameEvent; // marked as resolved
}

/**
 * Process a single event: apply all its effects to game state.
 * Returns updated state + resolved event. Pure function.
 */
export function processEvent(
  event: GameEvent,
  soldiers: Soldier[],
  finances: CompanyFinances,
  reputation: ReputationData,
  factions: Faction[]
): EventProcessResult {
  const effects = event.effects;

  return {
    soldiers: applyEffectsToSoldiers(soldiers, effects),
    finances: applyEffectsToFinances(finances, effects),
    reputation: applyEffectsToReputation(reputation, effects),
    factions: applyEffectsToFactions(factions, effects),
    event: { ...event, resolved: true },
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
