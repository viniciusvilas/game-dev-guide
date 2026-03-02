// Iron Contract — Mission Validator (GDD v2.0, pure, deterministic)
// Validates pre-conditions before a mission can start.

import type { Soldier } from '@/types/soldier';
import type { Contract } from '@/types/contract';
import type { MissionValidationResult, SoldierValidationError } from '@/types/mission';

/**
 * Validate that a set of soldiers can be assigned to a contract.
 * Returns detailed errors per soldier and global errors.
 */
export function validateMission(
  contract: Contract,
  soldiers: Soldier[],
  currentDay: number,
): MissionValidationResult {
  const globalErrors: string[] = [];
  const soldierErrors: SoldierValidationError[] = [];

  // Global: contract not expired
  if (currentDay > contract.expiresOnDay) {
    globalErrors.push(`Contrato expirou no dia ${contract.expiresOnDay}.`);
  }

  // Global: minimum squad size
  if (soldiers.length < contract.requiredSoldiers) {
    globalErrors.push(
      `Squad insuficiente: ${soldiers.length}/${contract.requiredSoldiers} soldados.`
    );
  }

  // Per-soldier validation
  for (const s of soldiers) {
    const errors: string[] = [];

    // Must be available
    if (s.status !== 'available') {
      errors.push(`Status "${s.status}" — não disponível para missão.`);
    }

    // Must have equipped weapon
    if (!s.equippedWeaponId) {
      errors.push('Sem arma equipada — impossível construir SoldierCombatInput.');
    }

    // Must have equipped armor
    if (!s.equippedArmorId) {
      errors.push('Sem colete equipado — impossível construir SoldierCombatInput.');
    }

    if (errors.length > 0) {
      soldierErrors.push({
        soldierId: s.id,
        soldierName: s.name,
        errors,
      });
    }
  }

  const valid = globalErrors.length === 0 && soldierErrors.length === 0;

  return { valid, errors: globalErrors, soldierErrors };
}
