// Iron Contract — Persistence (GDD v2.0)
// Saves/loads GameState to localStorage with version checking.

import type { GameState } from '@/types/game';

const SAVE_KEY = 'iron-contract-save';
const SAVE_VERSION = '1';

/** Serialize GameState to JSON string */
export function serializeState(state: GameState): string {
  return JSON.stringify({ ...state, version: SAVE_VERSION });
}

/** Deserialize JSON string to GameState. Returns null if version mismatch. */
export function deserializeState(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SAVE_VERSION) return null;
    return parsed as GameState;
  } catch {
    return null;
  }
}

/** Save game to localStorage */
export function saveGame(state: GameState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SAVE_KEY, serializeState(state));
}

/** Load game from localStorage. Returns null if no save or version incompatible. */
export function loadGame(): GameState | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  return deserializeState(raw);
}

/** Delete saved game */
export function deleteSave(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SAVE_KEY);
}
