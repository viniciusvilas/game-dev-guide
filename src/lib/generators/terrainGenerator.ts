// Iron Contract — Procedural Terrain Generator (simplex noise based)

import { createNoise2D } from 'simplex-noise';
import { createRng } from '@/lib/generators/seededRandom';

export type BiomeType =
  | 'deep_sea' | 'shallow_sea' | 'beach'
  | 'plains' | 'forest' | 'desert'
  | 'mountain' | 'snow' | 'urban';

export interface TerrainMap {
  width: number;
  height: number;
  heightmap: Float32Array;      // 0.0–1.0, row-major
  moisturemap: Float32Array;    // 0.0–1.0
  biomeMap: BiomeType[];        // flat array [y*width+x]
  pixelData: Uint8ClampedArray; // RGBA, ready for ImageData
}

const BIOME_COLORS: Record<BiomeType, [number, number, number]> = {
  deep_sea:    [26, 58, 92],
  shallow_sea: [45, 106, 159],
  beach:       [194, 178, 128],
  plains:      [122, 182, 72],
  forest:      [45, 90, 39],
  desert:      [200, 164, 90],
  mountain:    [139, 115, 85],
  snow:        [232, 232, 232],
  urban:       [200, 192, 176],
};

function classifyBiome(elevation: number, moisture: number): BiomeType {
  if (elevation < 0.30) return 'deep_sea';
  if (elevation < 0.38) return 'shallow_sea';
  if (elevation < 0.42) return 'beach';
  if (elevation < 0.55) {
    if (moisture > 0.6) return 'forest';
    if (moisture < 0.3) return 'desert';
    return 'plains';
  }
  if (elevation < 0.75) return 'mountain';
  return 'snow';
}

/**
 * Generates a full terrain map from a seed.
 * Pure and deterministic — same seed always produces the same terrain.
 */
export function generateTerrainMap(seed: number, width = 1000, height = 700): TerrainMap {
  const rng = createRng(seed);

  // Create two noise functions with different seeds for elevation layers
  const noise1 = createNoise2D(() => rng.next());
  const noise2 = createNoise2D(() => rng.next());
  // Moisture uses a separate noise
  const moistureNoise1 = createNoise2D(() => rng.next());
  const moistureNoise2 = createNoise2D(() => rng.next());

  const totalPixels = width * height;
  const heightmap = new Float32Array(totalPixels);
  const moisturemap = new Float32Array(totalPixels);
  const biomeMap: BiomeType[] = new Array(totalPixels);
  const pixelData = new Uint8ClampedArray(totalPixels * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      // Two octave elevation
      const e1 = noise1(x * 0.003, y * 0.003);
      const e2 = noise2(x * 0.008, y * 0.008);
      const elevation = (e1 * 0.7 + e2 * 0.3) * 0.5 + 0.5; // normalize to 0–1

      // Two octave moisture
      const m1 = moistureNoise1(x * 0.004, y * 0.004);
      const m2 = moistureNoise2(x * 0.01, y * 0.01);
      const moisture = (m1 * 0.6 + m2 * 0.4) * 0.5 + 0.5;

      heightmap[idx] = elevation;
      moisturemap[idx] = moisture;

      const biome = classifyBiome(elevation, moisture);
      biomeMap[idx] = biome;

      const color = BIOME_COLORS[biome];
      const pi = idx * 4;
      pixelData[pi] = color[0];
      pixelData[pi + 1] = color[1];
      pixelData[pi + 2] = color[2];
      pixelData[pi + 3] = 255;
    }
  }

  return { width, height, heightmap, moisturemap, biomeMap, pixelData };
}

/**
 * Stamp urban biome around city positions.
 * Modifies the terrain map in place.
 */
export function stampUrbanAreas(
  terrain: TerrainMap,
  positions: { x: number; y: number }[],
  radius = 8,
): void {
  const color = BIOME_COLORS.urban;
  for (const pos of positions) {
    const cx = Math.round(pos.x);
    const cy = Math.round(pos.y);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || px >= terrain.width || py < 0 || py >= terrain.height) continue;
        const idx = py * terrain.width + px;
        terrain.biomeMap[idx] = 'urban';
        const pi = idx * 4;
        terrain.pixelData[pi] = color[0];
        terrain.pixelData[pi + 1] = color[1];
        terrain.pixelData[pi + 2] = color[2];
      }
    }
  }
}

/**
 * Check if a position is on land (elevation > 0.42).
 */
export function isLandPosition(terrain: TerrainMap, x: number, y: number): boolean {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || px >= terrain.width || py < 0 || py >= terrain.height) return false;
  return terrain.heightmap[py * terrain.width + px] > 0.42;
}
