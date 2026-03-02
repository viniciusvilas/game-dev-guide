// Iron Contract — Equipment Manager (GDD v2.0, pure, deterministic)
// Equip, unequip, and repair functions for weapons and armor.

import type { Soldier } from '@/types/soldier';
import type { Weapon, Armor } from '@/types/equipment';

/** Equip a weapon on a soldier (sets equippedWeaponId) */
export function equipWeapon(soldier: Soldier, weaponId: string): Soldier {
  return { ...soldier, equippedWeaponId: weaponId };
}

/** Equip armor on a soldier (sets equippedArmorId) */
export function equipArmor(soldier: Soldier, armorId: string): Soldier {
  return { ...soldier, equippedArmorId: armorId };
}

/** Unequip weapon from a soldier */
export function unequipWeapon(soldier: Soldier): Soldier {
  return { ...soldier, equippedWeaponId: null };
}

/** Unequip armor from a soldier */
export function unequipArmor(soldier: Soldier): Soldier {
  return { ...soldier, equippedArmorId: null };
}

/** Repair a weapon to full condition (100%) */
export function repairWeapon(weapon: Weapon): Weapon {
  return { ...weapon, conditionPercent: 100, condition: 'new' as const };
}

/** Repair armor to full condition (100%) */
export function repairArmor(armor: Armor): Armor {
  return { ...armor, conditionPercent: 100, condition: 'new' as const };
}
