// Iron Contract — Event Triggers (GDD v2.0, pure, deterministic)
// Evaluates game state and returns conditional events.
// All trigger functions receive existingQueue to prevent duplicate active events.

import type { Soldier } from '@/types/soldier';
import type { CompanyFinances } from '@/types/economy';
import type { ReputationData } from '@/types/reputation';
import type { Faction } from '@/types/faction';
import type { GameEvent } from '@/types/events';

// === Helpers ===

/** Check if an event of given type targeting a specific entity is already active */
function isAlreadyActive(
  queue: GameEvent[],
  type: string,
  targetId?: string,
): boolean {
  return queue.some(
    e =>
      !e.resolved &&
      e.type === type &&
      (targetId === undefined || e.effects.some(eff => eff.targetId === targetId)),
  );
}

// === Soldier Triggers ===

/** Check soldier conditions and generate appropriate events */
export function checkSoldierTriggers(
  soldiers: Soldier[],
  day: number,
  existingQueue: GameEvent[],
): GameEvent[] {
  const events: GameEvent[] = [];

  // High stress breakdown
  const overStressed = soldiers.filter(s => s.status !== 'dead' && s.status !== 'deserted' && s.stress >= 90);
  for (const s of overStressed) {
    if (isAlreadyActive(existingQueue, 'soldier_breakdown', s.id)) continue;
    events.push({
      id: `evt-stress-${s.id}-d${day}`,
      type: 'soldier_breakdown',
      day,
      expiresOnDay: day + 1,
      priority: 'high',
      title: `Colapso: ${s.name}`,
      description: `${s.name} atingiu nível crítico de estresse e precisa de descanso imediato.`,
      effects: [{
        targetType: 'soldier',
        targetId: s.id,
        stressDelta: -20,
        moraleDelta: -15,
        statusChange: 'on_leave',
      }],
      resolved: false,
    });
  }

  // Low morale desertion risk
  const lowMorale = soldiers.filter(s => s.status !== 'dead' && s.status !== 'deserted' && s.morale <= 10);
  for (const s of lowMorale) {
    if (isAlreadyActive(existingQueue, 'soldier_deserted', s.id)) continue;
    events.push({
      id: `evt-desert-${s.id}-d${day}`,
      type: 'soldier_deserted',
      day,
      expiresOnDay: day + 1,
      priority: 'critical',
      title: `Risco de deserção: ${s.name}`,
      description: `${s.name} está com moral extremamente baixa e pode desertar.`,
      effects: [{
        targetType: 'soldier',
        targetId: s.id,
        statusChange: 'deserted',
      }],
      resolved: false,
    });
  }

  return events;
}

// === Finance Triggers ===

/** Check financial conditions and generate warning/crisis events */
export function checkFinanceTriggers(
  finances: CompanyFinances,
  day: number,
  existingQueue: GameEvent[],
): GameEvent[] {
  const events: GameEvent[] = [];

  const daysOfRunway = finances.dailyBurn > 0
    ? Math.floor(finances.balance / finances.dailyBurn)
    : Infinity;

  // Financial warning: balance below 7 days of burn
  if (daysOfRunway <= 7 && daysOfRunway > 3) {
    if (!isAlreadyActive(existingQueue, 'financial_warning')) {
      events.push({
        id: `evt-finwarn-d${day}`,
        type: 'financial_warning',
        day,
        expiresOnDay: day + 3,
        priority: 'high',
        title: 'Alerta financeiro',
        description: `Fundos restantes cobrem apenas ${daysOfRunway} dias de operação.`,
        effects: [],
        resolved: false,
      });
    }
  }

  // Financial crisis: balance below 3 days of burn
  if (daysOfRunway <= 3 && finances.balance > 0) {
    if (!isAlreadyActive(existingQueue, 'financial_crisis')) {
      events.push({
        id: `evt-fincrisis-d${day}`,
        type: 'financial_crisis',
        day,
        expiresOnDay: day + 1,
        priority: 'critical',
        title: 'Crise financeira',
        description: `A companhia está à beira da falência. Fundos para ${daysOfRunway} dia(s).`,
        effects: [{ targetType: 'soldier', stressDelta: 10, moraleDelta: -10 }],
        resolved: false,
      });
    }
  }

  // Bankrupt
  if (finances.balance <= 0) {
    if (!isAlreadyActive(existingQueue, 'financial_crisis')) {
      events.push({
        id: `evt-bankrupt-d${day}`,
        type: 'financial_crisis',
        day,
        expiresOnDay: day + 1,
        priority: 'critical',
        title: 'Falência',
        description: 'A companhia não tem mais fundos. Operações comprometidas.',
        effects: [{ targetType: 'soldier', stressDelta: 25, moraleDelta: -20 }],
        resolved: false,
      });
    }
  }

  return events;
}

// === Reputation Triggers ===

/** Check reputation milestones and generate events */
export function checkReputationTriggers(
  reputation: ReputationData,
  day: number,
  existingQueue: GameEvent[],
): GameEvent[] {
  const events: GameEvent[] = [];

  // Professional reputation milestone
  if (reputation.professional >= 80) {
    if (!isAlreadyActive(existingQueue, 'reputation_milestone')) {
      events.push({
        id: `evt-rephi-d${day}`,
        type: 'reputation_milestone',
        day,
        expiresOnDay: day + 7,
        priority: 'normal',
        title: 'Reputação excelente',
        description: 'A companhia é reconhecida como uma das melhores PMCs da região.',
        effects: [],
        resolved: false,
      });
    }
  }

  // Notoriety too high — attracts unwanted attention
  if (reputation.notoriety >= 70) {
    if (!isAlreadyActive(existingQueue, 'reputation_milestone')) {
      events.push({
        id: `evt-notoriety-d${day}`,
        type: 'reputation_milestone',
        day,
        expiresOnDay: day + 3,
        priority: 'high',
        title: 'Atenção indesejada',
        description: 'A notoriedade da companhia atraiu investigações e pressão política.',
        effects: [{
          targetType: 'company',
          professionalDelta: -3,
          balanceDelta: -1500,
        }],
        resolved: false,
      });
    }
  }

  // Rock bottom reputation
  if (reputation.professional <= 15) {
    if (!isAlreadyActive(existingQueue, 'reputation_milestone')) {
      events.push({
        id: `evt-replow-d${day}`,
        type: 'reputation_milestone',
        day,
        expiresOnDay: day + 5,
        priority: 'high',
        title: 'Reputação em ruínas',
        description: 'Clientes evitam contratar a companhia. Contratos mais lucrativos indisponíveis.',
        effects: [],
        resolved: false,
      });
    }
  }

  return events;
}

// === Faction Triggers ===

/** Check faction state and generate events */
export function checkFactionTriggers(
  factions: Faction[],
  day: number,
  existingQueue: GameEvent[],
): GameEvent[] {
  const events: GameEvent[] = [];

  for (const f of factions) {
    // Faction critically weakened
    if (f.militaryPower <= 10) {
      if (isAlreadyActive(existingQueue, 'faction_weakened', f.id)) continue;
      events.push({
        id: `evt-fweak-${f.id}-d${day}`,
        type: 'faction_weakened',
        day,
        expiresOnDay: day + 7,
        priority: 'normal',
        title: `${f.name} enfraquecida`,
        description: `A facção ${f.name} está com poder militar crítico. Pode se render ou reagrupar.`,
        effects: [],
        resolved: false,
      });
    }

    // Faction at full strength — danger
    if (f.militaryPower >= 90) {
      if (isAlreadyActive(existingQueue, 'faction_hostility_change', f.id)) continue;
      events.push({
        id: `evt-fstrong-${f.id}-d${day}`,
        type: 'faction_hostility_change',
        day,
        expiresOnDay: day + 5,
        priority: 'high',
        title: `${f.name} em posição de força`,
        description: `A facção ${f.name} controla a região com força esmagadora.`,
        effects: [],
        resolved: false,
      });
    }
  }

  return events;
}
