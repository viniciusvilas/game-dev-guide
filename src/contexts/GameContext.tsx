// Iron Contract — Game Context (React state management)

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { GameState } from '@/types/game';
import type { Soldier } from '@/types/soldier';
import type { Contract, MissionApproach } from '@/types/contract';
import type { Difficulty } from '@/types/company';
import type { StructureType } from '@/types/base';
import { newGame } from '@/lib/gameLoop/gameState';
import { advanceDay } from '@/lib/gameLoop/advanceDay';
import { saveGame, loadGame } from '@/lib/persistence/storage';
import { equipWeapon, equipArmor, unequipWeapon, unequipArmor, repairWeapon, repairArmor } from '@/lib/equipment/equipmentManager';
import { upgradeBuilding } from '@/lib/base/baseManager';
import { generateRecruitPool, hireRecruit, getRecruitmentCost } from '@/lib/recruitment/recruitmentSystem';
import { executeMission } from '@/lib/missions/missionManager';
import { applyMissionResult } from '@/lib/missions/missionApplicator';
import { validateMission } from '@/lib/missions/missionValidator';
import { getMarketCatalog, getWeaponRepairCost, getArmorRepairCost } from '@/lib/economy/marketPrices';
import { generateWeaponCatalog, generateArmorCatalog } from '@/lib/generators/equipmentTables';
import { createRng } from '@/lib/generators/seededRandom';

// === Types ===

export type Screen = 'title' | 'map' | 'dashboard' | 'soldiers' | 'contracts' | 'base' | 'market' | 'gameover';

type GameAction =
  | { type: 'NEW_GAME'; seed: number; difficulty: Difficulty }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'ADVANCE_DAY' }
  | { type: 'NAVIGATE'; screen: Screen }
  | { type: 'EQUIP_WEAPON'; soldierId: string; weaponId: string }
  | { type: 'EQUIP_ARMOR'; soldierId: string; armorId: string }
  | { type: 'UNEQUIP_WEAPON'; soldierId: string }
  | { type: 'UNEQUIP_ARMOR'; soldierId: string }
  | { type: 'REPAIR_WEAPON'; weaponId: string }
  | { type: 'REPAIR_ARMOR'; armorId: string }
  | { type: 'UPGRADE_BUILDING'; buildingType: StructureType }
  | { type: 'HIRE_RECRUIT'; soldier: Soldier }
  | { type: 'BUY_WEAPON'; weaponName: string }
  | { type: 'BUY_ARMOR'; armorName: string }
  | { type: 'EXECUTE_MISSION'; contract: Contract; soldierIds: string[]; approach: MissionApproach }
  | { type: 'RESOLVE_EVENT'; eventId: string }
  | { type: 'SAVE_GAME' };

interface GameContextState {
  gameState: GameState | null;
  screen: Screen;
  lastMissionResult: import('@/types/mission').MissionResult | null;
}

// === Reducer ===

function gameReducer(state: GameContextState, action: GameAction): GameContextState {
  switch (action.type) {
    case 'NEW_GAME': {
      const gs = newGame(action.seed, action.difficulty);
      return { ...state, gameState: gs, screen: 'map', lastMissionResult: null };
    }
    case 'LOAD_GAME':
      return { ...state, gameState: action.state, screen: 'map', lastMissionResult: null };
    case 'ADVANCE_DAY': {
      if (!state.gameState) return state;
      const next = advanceDay(state.gameState);
      saveGame(next);
      if (next.gameOver) {
        return { ...state, gameState: next, screen: 'gameover' };
      }
      return { ...state, gameState: next };
    }
    case 'NAVIGATE':
      return { ...state, screen: action.screen };
    case 'EQUIP_WEAPON': {
      if (!state.gameState) return state;
      const soldiers = state.gameState.soldiers.map(s =>
        s.id === action.soldierId ? equipWeapon(s, action.weaponId) : s
      );
      const gs = { ...state.gameState, soldiers };
      saveGame(gs);
      return { ...state, gameState: gs };
    }
    case 'EQUIP_ARMOR': {
      if (!state.gameState) return state;
      const soldiers = state.gameState.soldiers.map(s =>
        s.id === action.soldierId ? equipArmor(s, action.armorId) : s
      );
      const gs = { ...state.gameState, soldiers };
      saveGame(gs);
      return { ...state, gameState: gs };
    }
    case 'UNEQUIP_WEAPON': {
      if (!state.gameState) return state;
      const soldiers = state.gameState.soldiers.map(s =>
        s.id === action.soldierId ? unequipWeapon(s) : s
      );
      const gs = { ...state.gameState, soldiers };
      saveGame(gs);
      return { ...state, gameState: gs };
    }
    case 'UNEQUIP_ARMOR': {
      if (!state.gameState) return state;
      const soldiers = state.gameState.soldiers.map(s =>
        s.id === action.soldierId ? unequipArmor(s) : s
      );
      const gs = { ...state.gameState, soldiers };
      saveGame(gs);
      return { ...state, gameState: gs };
    }
    case 'REPAIR_WEAPON': {
      if (!state.gameState) return state;
      const weapon = state.gameState.weapons.find(w => w.id === action.weaponId);
      if (!weapon) return state;
      const cost = getWeaponRepairCost(weapon.name, state.gameState.seed, state.gameState.currentDay);
      if (state.gameState.finances.balance < cost) return state;
      const weapons = state.gameState.weapons.map(w =>
        w.id === action.weaponId ? repairWeapon(w) : w
      );
      const gs = {
        ...state.gameState,
        weapons,
        finances: { ...state.gameState.finances, balance: state.gameState.finances.balance - cost },
      };
      saveGame(gs);
      return { ...state, gameState: gs };
    }
    case 'REPAIR_ARMOR': {
      if (!state.gameState) return state;
      const armor = state.gameState.armors.find(a => a.id === action.armorId);
      if (!armor) return state;
      const cost = getArmorRepairCost(armor.name, state.gameState.seed, state.gameState.currentDay);
      if (state.gameState.finances.balance < cost) return state;
      const armors = state.gameState.armors.map(a =>
        a.id === action.armorId ? repairArmor(a) : a
      );
      const gs = {
        ...state.gameState,
        armors,
        finances: { ...state.gameState.finances, balance: state.gameState.finances.balance - cost },
      };
      saveGame(gs);
      return { ...state, gameState: gs };
    }
    case 'UPGRADE_BUILDING': {
      if (!state.gameState) return state;
      const structure = state.gameState.base.structures.find(s => s.type === action.buildingType);
      if (!structure) return state;
      if (state.gameState.finances.balance < structure.upgradeCost) return state;
      const base = upgradeBuilding(state.gameState.base, action.buildingType);
      const gs = {
        ...state.gameState,
        base,
        finances: { ...state.gameState.finances, balance: state.gameState.finances.balance - structure.upgradeCost },
      };
      saveGame(gs);
      return { ...state, gameState: gs };
    }
    case 'HIRE_RECRUIT': {
      if (!state.gameState) return state;
      const result = hireRecruit(action.soldier, state.gameState.finances.balance, state.gameState.currentDay);
      if (!result) return state;
      const gs = {
        ...state.gameState,
        soldiers: [...state.gameState.soldiers, result.soldier],
        finances: {
          ...state.gameState.finances,
          balance: state.gameState.finances.balance + result.transaction.amount,
          transactions: [...state.gameState.finances.transactions, result.transaction],
        },
      };
      saveGame(gs);
      return { ...state, gameState: gs };
    }
    case 'BUY_WEAPON': {
      if (!state.gameState) return state;
      const catalog = getMarketCatalog(state.gameState.seed, state.gameState.currentDay);
      const item = catalog.weapons.find(w => w.name === action.weaponName);
      if (!item || state.gameState.finances.balance < item.price) return state;
      const rng = createRng(state.gameState.seed + state.gameState.currentDay + state.gameState.weapons.length);
      const newWeapons = generateWeaponCatalog(rng.nextInt(0, 2147483647));
      const weapon = newWeapons.find(w => w.name === action.weaponName);
      if (!weapon) return state;
      const gs = {
        ...state.gameState,
        weapons: [...state.gameState.weapons, { ...weapon, id: `weapon-bought-${Date.now()}` }],
        finances: { ...state.gameState.finances, balance: state.gameState.finances.balance - item.price },
      };
      saveGame(gs);
      return { ...state, gameState: gs };
    }
    case 'BUY_ARMOR': {
      if (!state.gameState) return state;
      const catalog = getMarketCatalog(state.gameState.seed, state.gameState.currentDay);
      const item = catalog.armors.find(a => a.name === action.armorName);
      if (!item || state.gameState.finances.balance < item.price) return state;
      const rng = createRng(state.gameState.seed + state.gameState.currentDay + state.gameState.armors.length);
      const newArmors = generateArmorCatalog(rng.nextInt(0, 2147483647));
      const armor = newArmors.find(a => a.name === action.armorName);
      if (!armor) return state;
      const gs = {
        ...state.gameState,
        armors: [...state.gameState.armors, { ...armor, id: `armor-bought-${Date.now()}` }],
        finances: { ...state.gameState.finances, balance: state.gameState.finances.balance - item.price },
      };
      saveGame(gs);
      return { ...state, gameState: gs };
    }
    case 'EXECUTE_MISSION': {
      if (!state.gameState) return state;
      const soldiers = state.gameState.soldiers.filter(s => action.soldierIds.includes(s.id));
      const faction = state.gameState.factions.find(f => f.id === action.contract.targetFactionId);
      if (!faction) return state;

      const validation = validateMission(action.contract, soldiers, state.gameState.currentDay);
      if (!validation.valid) return state;

      const missionResult = executeMission(
        state.gameState.seed + state.gameState.currentDay,
        action.contract,
        soldiers,
        state.gameState.weapons,
        state.gameState.armors,
        faction,
        state.gameState.world,
        state.gameState.reputation,
        action.approach,
        state.gameState.currentDay,
      );

      let gs = applyMissionResult(missionResult, state.gameState);
      gs = {
        ...gs,
        availableContracts: gs.availableContracts.filter(c => c.id !== action.contract.id),
        contractHistory: [...gs.contractHistory, {
          contractId: action.contract.id,
          outcome: missionResult.combatResult.outcome,
          casualtyIds: missionResult.combatResult.playerCasualties,
          injuredIds: missionResult.combatResult.playerInjured,
          rewardEarned: missionResult.transactions.reduce((s, t) => s + t.amount, 0),
          reputationChange: 0,
          lootWeaponIds: [],
          day: state.gameState.currentDay,
        }],
      };
      saveGame(gs);
      return { ...state, gameState: gs, lastMissionResult: missionResult };
    }
    case 'RESOLVE_EVENT': {
      if (!state.gameState) return state;
      const events = state.gameState.events.map(e =>
        e.id === action.eventId ? { ...e, resolved: true } : e
      );
      const gs = { ...state.gameState, events };
      saveGame(gs);
      return { ...state, gameState: gs };
    }
    case 'SAVE_GAME': {
      if (state.gameState) saveGame(state.gameState);
      return state;
    }
    default:
      return state;
  }
}

// === Context ===

interface GameContextValue {
  state: GameContextState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, {
    gameState: null,
    screen: 'title',
    lastMissionResult: null,
  });

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export type { GameAction };
