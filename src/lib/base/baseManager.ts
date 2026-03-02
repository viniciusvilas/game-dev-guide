// Iron Contract — Base Manager (GDD v2.0, pure, deterministic)
// Creates and upgrades base structures.

import type { Base, BaseStructure, StructureType } from '@/types/base';

// === Building Costs & Capacities ===

interface StructureConfig {
  baseCost: number;
  costMultiplier: number; // cost = baseCost * costMultiplier^(level-1)
  baseCapacity: number;
  capacityPerLevel: number;
}

const STRUCTURE_CONFIGS: Record<StructureType, StructureConfig> = {
  barracks:       { baseCost: 2000, costMultiplier: 1.8, baseCapacity: 4,  capacityPerLevel: 4 },
  armory:         { baseCost: 1500, costMultiplier: 1.6, baseCapacity: 8,  capacityPerLevel: 6 },
  medical_center: { baseCost: 2500, costMultiplier: 2.0, baseCapacity: 2,  capacityPerLevel: 2 },
  ops_room:       { baseCost: 3000, costMultiplier: 1.5, baseCapacity: 1,  capacityPerLevel: 1 },
};

/** Calculate upgrade cost for a building at a given level */
export function getBuildingCost(type: StructureType, currentLevel: number): number {
  const config = STRUCTURE_CONFIGS[type];
  return Math.round(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
}

/** Calculate capacity for a structure at a given level */
function getCapacity(type: StructureType, level: number): number {
  const config = STRUCTURE_CONFIGS[type];
  return config.baseCapacity + (level - 1) * config.capacityPerLevel;
}

/** Create the initial base with level 1 structures */
export function createInitialBase(cityId: string): Base {
  const structures: BaseStructure[] = (['barracks', 'armory', 'medical_center', 'ops_room'] as StructureType[]).map(type => ({
    type,
    level: 1,
    upgradeCost: getBuildingCost(type, 1),
    capacity: getCapacity(type, 1),
  }));

  const barracks = structures.find(s => s.type === 'barracks')!;

  return {
    id: 'base-hq',
    name: 'Base de Operações',
    cityId,
    structures,
    maxSoldiers: barracks.capacity,
  };
}

/** Upgrade a specific building in the base. Returns new Base. */
export function upgradeBuilding(base: Base, buildingType: StructureType): Base {
  const structure = base.structures.find(s => s.type === buildingType);
  if (!structure || structure.level >= 5) return base;

  const newLevel = structure.level + 1;
  const newStructures = base.structures.map(s => {
    if (s.type !== buildingType) return s;
    return {
      ...s,
      level: newLevel,
      upgradeCost: getBuildingCost(buildingType, newLevel),
      capacity: getCapacity(buildingType, newLevel),
    };
  });

  const newBarracks = newStructures.find(s => s.type === 'barracks')!;

  return {
    ...base,
    structures: newStructures,
    maxSoldiers: newBarracks.capacity,
  };
}

/** Get current building level */
export function getBuildingLevel(base: Base, type: StructureType): number {
  return base.structures.find(s => s.type === type)?.level ?? 0;
}
