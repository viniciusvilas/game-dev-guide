// Iron Contract — Damage Model (GDD v2.0, pure, deterministic)
// PS, DPS, HP efetivo, modificadores de distância/abrigo/intel

import type { SoldierCombatInput, FactionCombatInput, MissionCombatContext, DistanceCategory, ShelterLevel, IntelLevel } from '@/types/combat';

// === Power Score (PS) ===

/** Calculate a soldier's Power Score based on combat attr, weapon and rank */
export function calculatePS(soldier: SoldierCombatInput): number {
  const rankBonus = RANK_PS_BONUS[soldier.rank] ?? 0;
  const stressPenalty = 1 - (soldier.stress / 200); // stress 100 → 0.5x, stress 0 → 1.0x
  const moralBonus = 1 + (soldier.morale - 50) / 200; // morale 100 → 1.25x, morale 0 → 0.75x
  return (soldier.combat + rankBonus) * stressPenalty * moralBonus;
}

const RANK_PS_BONUS: Record<string, number> = {
  recruit: 0,
  operator: 3,
  corporal: 6,
  sergeant: 10,
  sergeant_major: 14,
  lieutenant: 18,
  captain: 23,
  major: 28,
};

// === DPS (Damage Per Second) ===

/** DPS = pfb * cad / 10 */
export function calculateDPS(pfb: number, cad: number): number {
  return (pfb * cad) / 10;
}

/** Calculate soldier DPS incorporating PS */
export function calculateSoldierDPS(soldier: SoldierCombatInput): number {
  const baseDPS = calculateDPS(soldier.pfb, soldier.cad);
  const ps = calculatePS(soldier);
  // PS scales DPS: higher combat skill = more effective fire
  return baseDPS * (ps / 50); // ps ~50 = 1.0x multiplier
}

// === HP Efetivo ===

/** HP_efetivo = 100 / (1 - MT_vest). No armor (mtVest=0) → HP=100 */
export function calculateEffectiveHP(mtVest: number): number {
  const clamped = Math.min(Math.max(mtVest, 0), 0.88);
  return 100 / (1 - clamped);
}

// === Faction DPS ===

/** Faction total DPS = troops * troopLevel * equipmentMultiplier * stressFactor */
export function calculateFactionDPS(faction: FactionCombatInput): number {
  const stressFactor = faction.stressBase;
  return faction.troops * faction.troopLevel * faction.equipmentMultiplier * stressFactor;
}

/** Faction total HP (estimated) */
export function calculateFactionHP(faction: FactionCombatInput): number {
  // Each troop has base HP 100, equipment level adds armor equivalent
  const armorFactor = 1 + (faction.equipmentLevel - 1) * 0.1; // level 1→1.0, 5→1.4
  return faction.troops * 100 * armorFactor;
}

// === Distance Modifier ===

const DISTANCE_MOD: Record<DistanceCategory, Record<string, number>> = {
  close:  { pistol: 1.2, smg: 1.1, assault_rifle: 0.9, precision_rifle: 0.5, machine_gun: 0.8, shotgun: 1.4 },
  medium: { pistol: 0.8, smg: 1.0, assault_rifle: 1.2, precision_rifle: 1.0, machine_gun: 1.1, shotgun: 0.5 },
  long:   { pistol: 0.4, smg: 0.6, assault_rifle: 1.0, precision_rifle: 1.5, machine_gun: 0.9, shotgun: 0.2 },
};

/** Get distance modifier for a weapon category at a given distance */
export function getDistanceModifier(distance: DistanceCategory, weaponCategory: string): number {
  return DISTANCE_MOD[distance]?.[weaponCategory] ?? 1.0;
}

// === Shelter Modifier ===

const SHELTER_DAMAGE_REDUCTION: Record<ShelterLevel, number> = {
  0: 0.00,  // no cover
  1: 0.15,  // light cover
  2: 0.30,  // medium cover
  3: 0.50,  // heavy cover
};

/** Damage reduction factor from shelter (0 = full damage, 0.5 = half damage) */
export function getShelterReduction(shelter: ShelterLevel): number {
  return SHELTER_DAMAGE_REDUCTION[shelter] ?? 0;
}

// === Intel Modifier ===

const INTEL_ACCURACY_BONUS: Record<IntelLevel, number> = {
  0: 0.70,  // blind — 30% penalty
  1: 0.85,  // minimal intel
  2: 1.00,  // standard
  3: 1.15,  // full intel — 15% bonus
};

/** Accuracy multiplier based on intel level */
export function getIntelModifier(intel: IntelLevel): number {
  return INTEL_ACCURACY_BONUS[intel] ?? 1.0;
}

// === Approach Modifier ===

export function getApproachModifier(approach: string): { playerDpsMod: number; enemyDpsMod: number; stealthBonus: number } {
  switch (approach) {
    case 'stealth':
      return { playerDpsMod: 0.8, enemyDpsMod: 0.5, stealthBonus: 0.3 };
    case 'frontal':
      return { playerDpsMod: 1.2, enemyDpsMod: 1.0, stealthBonus: 0.0 };
    case 'quick':
      return { playerDpsMod: 1.0, enemyDpsMod: 0.8, stealthBonus: 0.1 };
    default:
      return { playerDpsMod: 1.0, enemyDpsMod: 1.0, stealthBonus: 0.0 };
  }
}

// === Night Modifier ===

export function getTimeOfDayModifier(timeOfDay: string): { accuracyMod: number; stealthMod: number } {
  if (timeOfDay === 'night') {
    return { accuracyMod: 0.85, stealthMod: 1.2 };
  }
  return { accuracyMod: 1.0, stealthMod: 1.0 };
}

// === Penetration vs Armor ===

/** Effective damage after penetration vs armor level. pen > nivel → bonus, pen < nivel → penalty */
export function calculatePenetrationFactor(pen: number, armorNivel: number): number {
  const diff = pen - armorNivel;
  // Each point of difference = ±10% damage
  return Math.max(0.3, Math.min(2.0, 1.0 + diff * 0.1));
}

// === Aggregate Player DPS for combat ===

/** Calculate total effective DPS for the player squad in a given context */
export function calculateSquadDPS(
  soldiers: SoldierCombatInput[],
  context: MissionCombatContext
): number {
  const approachMod = getApproachModifier(context.approach);
  const intelMod = getIntelModifier(context.intel);
  const timeMod = getTimeOfDayModifier(context.timeOfDay);

  let totalDPS = 0;
  for (const s of soldiers) {
    const baseDPS = calculateSoldierDPS(s);
    const distMod = getDistanceModifier(context.distance, s.weaponCategory);
    totalDPS += baseDPS * distMod * intelMod * timeMod.accuracyMod;
  }

  return totalDPS * approachMod.playerDpsMod;
}

/** Calculate effective DPS the enemy faction deals to player squad */
export function calculateEnemyDPSToSquad(
  faction: FactionCombatInput,
  context: MissionCombatContext,
  playerShelter: ShelterLevel
): number {
  const factionDPS = calculateFactionDPS(faction);
  const shelterRed = getShelterReduction(playerShelter);
  const approachMod = getApproachModifier(context.approach);
  return factionDPS * (1 - shelterRed) * approachMod.enemyDpsMod;
}
