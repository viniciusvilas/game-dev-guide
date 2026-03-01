// Iron Contract — Event Generator (GDD v2.0, pure, deterministic)
// Generates random daily events using seeded PRNG.

import type { GameEvent, EventType, EventPriority, EventEffect } from '@/types/events';
import { createRng, type SeededRng } from '@/lib/generators/seededRandom';

// === Random Event Templates ===

interface EventTemplate {
  type: EventType;
  priority: EventPriority;
  duration: number; // days until expiry
  title: string;
  description: string;
  effects: EventEffect[];
}

const RANDOM_TEMPLATES: EventTemplate[] = [
  {
    type: 'random_encounter',
    priority: 'normal',
    duration: 3,
    title: 'Mercado negro ativo',
    description: 'Um contato oferece equipamento com desconto por tempo limitado.',
    effects: [{ targetType: 'company', balanceDelta: -500 }],
  },
  {
    type: 'random_encounter',
    priority: 'low',
    duration: 1,
    title: 'Boatos na região',
    description: 'Informantes locais compartilham inteligência sobre movimentos inimigos.',
    effects: [],
  },
  {
    type: 'random_encounter',
    priority: 'normal',
    duration: 2,
    title: 'Doação anônima',
    description: 'Um benfeitor anônimo fez uma contribuição para a companhia.',
    effects: [{ targetType: 'company', balanceDelta: 1000 }],
  },
  {
    type: 'random_encounter',
    priority: 'high',
    duration: 1,
    title: 'Emboscada na estrada',
    description: 'Um comboio de suprimentos foi atacado. Perdas materiais reportadas.',
    effects: [{ targetType: 'company', balanceDelta: -2000 }],
  },
  {
    type: 'random_encounter',
    priority: 'normal',
    duration: 5,
    title: 'Moral elevada',
    description: 'Uma vitória recente inspirou os soldados. Moral temporariamente elevada.',
    effects: [{ targetType: 'soldier', moraleDelta: 10 }],
  },
  {
    type: 'random_encounter',
    priority: 'normal',
    duration: 3,
    title: 'Tensão no acampamento',
    description: 'Disputas internas aumentaram o estresse da equipe.',
    effects: [{ targetType: 'soldier', stressDelta: 15 }],
  },
  {
    type: 'random_encounter',
    priority: 'high',
    duration: 2,
    title: 'Desertor capturado',
    description: 'Um desertor inimigo fornece informações valiosas sobre a facção.',
    effects: [{ targetType: 'faction', factionStrengthDelta: -5 }],
  },
  {
    type: 'reputation_milestone',
    priority: 'normal',
    duration: 1,
    title: 'Cobertura da mídia',
    description: 'A companhia recebeu atenção positiva da imprensa internacional.',
    effects: [{ targetType: 'company', professionalDelta: 3, notorietyDelta: 5 }],
  },
];

// === Generator ===

/**
 * Generate random events for a given day.
 * Uses seed + day to ensure determinism.
 * Returns 0-2 random events per day based on probability.
 */
export function generateDailyRandomEvents(
  seed: number,
  day: number
): GameEvent[] {
  const rng = createRng(seed + day * 31);
  const events: GameEvent[] = [];

  // Base chance: 30% for first event, 10% for second
  if (rng.chance(0.30)) {
    events.push(createRandomEvent(rng, day, 0));
  }
  if (rng.chance(0.10)) {
    events.push(createRandomEvent(rng, day, 1));
  }

  return events;
}

function createRandomEvent(rng: SeededRng, day: number, index: number): GameEvent {
  const template = rng.pick(RANDOM_TEMPLATES);

  return {
    id: `evt-rng-d${day}-${index}`,
    type: template.type,
    day,
    expiresOnDay: day + template.duration,
    priority: template.priority,
    title: template.title,
    description: template.description,
    effects: template.effects.map(e => ({ ...e })),
    resolved: false,
  };
}
