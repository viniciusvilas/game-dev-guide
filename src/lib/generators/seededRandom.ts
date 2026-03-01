// Iron Contract — Seeded PRNG (Mulberry32)
// Pure, deterministic pseudo-random number generator.

export interface SeededRng {
  /** Returns a float in [0, 1) and advances state */
  next(): number;
  /** Returns integer in [min, max] inclusive */
  nextInt(min: number, max: number): number;
  /** Returns float in [min, max) */
  nextFloat(min: number, max: number): number;
  /** Pick a random element from an array */
  pick<T>(array: readonly T[]): T;
  /** Shuffle array (Fisher-Yates), returns new array */
  shuffle<T>(array: readonly T[]): T[];
  /** Returns true with given probability (0-1) */
  chance(probability: number): boolean;
  /** Fork a child RNG from current state (for sub-generators) */
  fork(): SeededRng;
}

/**
 * Creates a deterministic PRNG using Mulberry32 algorithm.
 * Same seed always produces the same sequence.
 */
export function createRng(seed: number): SeededRng {
  let state = seed | 0;

  function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function nextFloat(min: number, max: number): number {
    return next() * (max - min) + min;
  }

  function pick<T>(array: readonly T[]): T {
    return array[Math.floor(next() * array.length)];
  }

  function shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function chance(probability: number): boolean {
    return next() < probability;
  }

  function fork(): SeededRng {
    return createRng(nextInt(0, 2147483647));
  }

  return { next, nextInt, nextFloat, pick, shuffle, chance, fork };
}

/** Derive a numeric seed from a string */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash;
}
