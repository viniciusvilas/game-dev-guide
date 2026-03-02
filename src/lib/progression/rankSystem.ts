// Iron Contract — Rank System (GDD v2.0, pure, deterministic)
// Handles rank promotions and skill unlocks per rank.

import type { Rank, SoldierSkill } from '@/types/soldier';

// === Rank Order & Requirements ===

const RANK_ORDER: Rank[] = [
  'recruit', 'operator', 'corporal', 'sergeant',
  'sergeant_major', 'lieutenant', 'captain', 'major',
];

export interface RankRequirement {
  minXP: number;
  minMissions: number;
}

const RANK_REQUIREMENTS: Record<Rank, RankRequirement> = {
  recruit:        { minXP: 0,    minMissions: 0 },
  operator:       { minXP: 50,   minMissions: 2 },
  corporal:       { minXP: 150,  minMissions: 5 },
  sergeant:       { minXP: 350,  minMissions: 10 },
  sergeant_major: { minXP: 600,  minMissions: 18 },
  lieutenant:     { minXP: 1000, minMissions: 30 },
  captain:        { minXP: 1600, minMissions: 50 },
  major:          { minXP: 2500, minMissions: 80 },
};

// === Skill Unlocks ===

const SKILLS_BY_RANK: Record<Rank, SoldierSkill[]> = {
  recruit:        [],
  operator:       ['scout'],
  corporal:       ['medic', 'communications'],
  sergeant:       ['demolitions'],
  sergeant_major: ['sniper'],
  lieutenant:     ['heavy_weapons'],
  captain:        [],
  major:          [],
};

// === Public API ===

/** Get the next rank above the current one, or null if at max */
export function getNextRank(current: Rank): Rank | null {
  const idx = RANK_ORDER.indexOf(current);
  if (idx < 0 || idx >= RANK_ORDER.length - 1) return null;
  return RANK_ORDER[idx + 1];
}

/** Get the rank index (0 = recruit, 7 = major) */
export function getRankIndex(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

/** Check if a soldier qualifies for promotion */
export function canPromote(
  currentRank: Rank,
  xp: number,
  missionsCompleted: number,
): boolean {
  const next = getNextRank(currentRank);
  if (!next) return false;
  const req = RANK_REQUIREMENTS[next];
  return xp >= req.minXP && missionsCompleted >= req.minMissions;
}

/** Promote a soldier to the next rank. Returns updated rank or same if not eligible. */
export function promote(
  currentRank: Rank,
  xp: number,
  missionsCompleted: number,
): Rank {
  if (!canPromote(currentRank, xp, missionsCompleted)) return currentRank;
  return getNextRank(currentRank)!;
}

/** Get skills unlocked at a specific rank */
export function getSkillsUnlockedAtRank(rank: Rank): SoldierSkill[] {
  return [...SKILLS_BY_RANK[rank]];
}

/** Get all skills available up to and including a rank */
export function getAvailableSkills(rank: Rank): SoldierSkill[] {
  const idx = getRankIndex(rank);
  const skills: SoldierSkill[] = [];
  for (let i = 0; i <= idx; i++) {
    skills.push(...SKILLS_BY_RANK[RANK_ORDER[i]]);
  }
  return skills;
}

/** Get rank requirements for a specific rank */
export function getRankRequirements(rank: Rank): RankRequirement {
  return { ...RANK_REQUIREMENTS[rank] };
}
