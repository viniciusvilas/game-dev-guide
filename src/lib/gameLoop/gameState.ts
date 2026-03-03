// Iron Contract — Game State Factory (GDD v2.0, pure, deterministic)
// Creates initial GameState from seed + difficulty + optional startCityId.

import type { GameState } from '@/types/game';
import type { Difficulty } from '@/types/company';
import { generateWorld } from '@/lib/generators/worldGenerator';
import { generateStartingRoster } from '@/lib/generators/soldierGenerator';
import { generateFactions } from '@/lib/generators/factionGenerator';
import { generateCEO, generateOfficials } from '@/lib/generators/characterGenerator';
import { generateWeaponCatalog, generateArmorCatalog } from '@/lib/generators/equipmentTables';
import { generateContracts } from '@/lib/generators/contractGenerator';
import { createInitialFinances } from '@/lib/economy/financeEngine';
import { createInitialBase } from '@/lib/base/baseManager';
import { createRng } from '@/lib/generators/seededRandom';
import { SAVE_VERSION } from '@/lib/persistence/storage';

const DIFFICULTY_CONFIG: Record<Difficulty, { funds: number; soldiers: number; factions: number }> = {
  easy:   { funds: 80000, soldiers: 8, factions: 4 },
  normal: { funds: 50000, soldiers: 6, factions: 5 },
  hard:   { funds: 30000, soldiers: 4, factions: 6 },
};

/**
 * Create a new game from a seed, difficulty, and optional starting city.
 * Pure and deterministic — same seed + difficulty = same game.
 */
export function newGame(seed: number, difficulty: Difficulty, startCityId?: string): GameState {
  const config = DIFFICULTY_CONFIG[difficulty];
  const rng = createRng(seed);

  // Generate world + terrain
  const worldSeed = { value: seed, timestamp: 0 };
  const { world, terrainMap } = generateWorld(worldSeed);

  // Find starting city: use provided ID or default to first large city
  let startingCityId = startCityId;
  if (!startingCityId) {
    startingCityId = world.countries[0].regions[0].cities[0].id;
  }

  // Generate company
  const companyId = `company-${rng.nextInt(100000, 999999)}`;
  const company = {
    id: companyId,
    name: 'Iron Contract PMC',
    countryId: world.countries[0].id,
    difficulty,
    funds: config.funds,
    dailyExpenses: 0,
    foundedDay: 1,
  };

  // Generate CEO
  const ceo = generateCEO(rng.nextInt(0, 2147483647), companyId);

  // Generate base at chosen city
  const base = createInitialBase(startingCityId);

  // Generate soldiers
  const soldiers = generateStartingRoster(rng.nextInt(0, 2147483647), config.soldiers);

  // Generate equipment
  const weapons = generateWeaponCatalog(rng.nextInt(0, 2147483647));
  const armors = generateArmorCatalog(rng.nextInt(0, 2147483647));

  // Generate factions
  const factions = generateFactions(rng.nextInt(0, 2147483647), world, config.factions);

  // Generate officials
  const officials = generateOfficials(rng.nextInt(0, 2147483647), world);

  // Generate initial contracts (company level 1)
  const contracts = generateContracts(
    rng.nextInt(0, 2147483647), 1, world, factions, officials, 3, 1,
  );

  // Initial finances
  const finances = createInitialFinances(config.funds);

  // Initial reputation
  const reputation = {
    professional: 50,
    notoriety: 10,
    ceoReputation: [],
    byCountry: world.countries.map(c => ({ countryId: c.id, value: 0 })),
  };

  return {
    version: SAVE_VERSION,
    seed,
    difficulty,
    world,
    terrainMap,
    company,
    ceo,
    base,
    soldiers,
    weapons,
    armors,
    factions,
    officials,
    availableContracts: contracts,
    activeContracts: [],
    contractHistory: [],
    finances,
    reputation,
    events: [],
    currentDay: 1,
    gameOver: null,
    companyLevel: 1,
  };
}
