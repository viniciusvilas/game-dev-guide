// Iron Contract — Game Over Checker (GDD v2.0, pure, deterministic)

import type { GameState } from '@/types/game';

export type GameOverReason = 'bankruptcy' | 'no_soldiers' | null;

/**
 * Check if the game is over.
 * Returns null if the game is still active.
 */
export function checkGameOver(state: GameState): GameOverReason {
  // Bankruptcy: balance <= 0 after daily tick
  if (state.finances.balance <= 0) {
    return 'bankruptcy';
  }

  // No soldiers: all dead or deserted
  const activeSoldiers = state.soldiers.filter(
    s => s.status !== 'dead' && s.status !== 'deserted'
  );
  if (activeSoldiers.length === 0) {
    return 'no_soldiers';
  }

  return null;
}
