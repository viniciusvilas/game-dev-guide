// Iron Contract — Weapon Mastery System (GDD v2.0, pure, deterministic)
// Mastery grows with weapon usage in combat, range 0-100, diminishing returns above 60.

import type { Soldier, WeaponCategory, WeaponMastery } from '@/types/soldier';

// === Mastery Gain Logic ===

/** Calculate mastery gain based on missions with a specific weapon category.
 *  Diminishing returns above 60. */
export function calculateMasteryGain(
  soldier: Soldier,
  weaponCategory: WeaponCategory,
  missionsWithWeapon: number,
): number {
  const current = getMasteryLevel(soldier, weaponCategory);

  if (current >= 100) return 0;

  // Base gain per mission batch
  const baseGain = Math.max(1, Math.floor(missionsWithWeapon * 3));

  // Diminishing returns above 60
  let effectiveGain: number;
  if (current >= 90) {
    effectiveGain = Math.max(1, Math.floor(baseGain * 0.2));
  } else if (current >= 75) {
    effectiveGain = Math.max(1, Math.floor(baseGain * 0.4));
  } else if (current >= 60) {
    effectiveGain = Math.max(1, Math.floor(baseGain * 0.6));
  } else {
    effectiveGain = baseGain;
  }

  // Clamp to not exceed 100
  return Math.min(effectiveGain, 100 - current);
}

/** Apply mastery gain to a soldier, returning a new Soldier */
export function applyMasteryGain(
  soldier: Soldier,
  category: WeaponCategory,
  gain: number,
): Soldier {
  if (gain <= 0) return soldier;

  const existing = soldier.weaponMasteries.find(m => m.category === category);
  let newMasteries: WeaponMastery[];

  if (existing) {
    newMasteries = soldier.weaponMasteries.map(m =>
      m.category === category
        ? { ...m, level: Math.min(100, m.level + gain) }
        : m,
    );
  } else {
    newMasteries = [
      ...soldier.weaponMasteries,
      { category, level: Math.min(100, gain) },
    ];
  }

  return { ...soldier, weaponMasteries: newMasteries };
}

/** Get current mastery level for a weapon category */
export function getMasteryLevel(
  soldier: Soldier,
  category: WeaponCategory,
): number {
  return soldier.weaponMasteries.find(m => m.category === category)?.level ?? 0;
}
