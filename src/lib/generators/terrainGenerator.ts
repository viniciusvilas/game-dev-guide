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
  countryMap: Uint8Array;       // 0=country1, 1=country2, 255=sea
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

/**
 * Continent mask: creates an island shape where edges are sea and center is land.
 * noiseOffsetX/Y break symmetry for organic coastlines.
 */
function continentMask(
  x: number, y: number, w: number, h: number,
  noiseVal: number,
): number {
  const dx = (x / w - 0.5) * 2; // -1 to 1
  const dy = (y / h - 0.5) * 2;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const base = Math.max(0, 1 - dist * 0.85);
  // Add noise perturbation to break perfect circle
  return Math.max(0, Math.min(1, base + noiseVal * 0.1));
}

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
 * Generate Voronoi-based country assignments for land pixels.
 * Two seed points placed deterministically on land.
 */
function generateCountryMap(
  seed: number,
  width: number,
  height: number,
  heightmap: Float32Array,
): Uint8Array {
  const rng = createRng(seed + 7777);
  const countryMap = new Uint8Array(width * height);
  countryMap.fill(255); // default = sea

  // Find two Voronoi seed points on land
  const seeds: { x: number; y: number }[] = [];
  
  // Country 0 seed: left half of map
  for (let attempt = 0; attempt < 500; attempt++) {
    const sx = rng.nextInt(width * 0.15, width * 0.45);
    const sy = rng.nextInt(height * 0.2, height * 0.8);
    if (heightmap[sy * width + sx] > 0.42) {
      seeds.push({ x: sx, y: sy });
      break;
    }
  }
  if (seeds.length === 0) seeds.push({ x: Math.floor(width * 0.3), y: Math.floor(height * 0.5) });

  // Country 1 seed: right half of map
  for (let attempt = 0; attempt < 500; attempt++) {
    const sx = rng.nextInt(width * 0.55, width * 0.85);
    const sy = rng.nextInt(height * 0.2, height * 0.8);
    if (heightmap[sy * width + sx] > 0.42) {
      seeds.push({ x: sx, y: sy });
      break;
    }
  }
  if (seeds.length === 1) seeds.push({ x: Math.floor(width * 0.7), y: Math.floor(height * 0.5) });

  // Assign each land pixel to nearest seed
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (heightmap[idx] <= 0.42) continue; // sea
      
      let minDist = Infinity;
      let closest = 0;
      for (let s = 0; s < seeds.length; s++) {
        const dx = x - seeds[s].x;
        const dy = y - seeds[s].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          closest = s;
        }
      }
      countryMap[idx] = closest;
    }
  }

  return countryMap;
}

/**
 * Render country borders into pixel data.
 * Where countryMap changes between adjacent pixels, draw white border.
 */
function renderCountryBorders(
  pixelData: Uint8ClampedArray,
  countryMap: Uint8Array,
  width: number,
  height: number,
): void {
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idx = y * width + x;
      const current = countryMap[idx];
      const right = countryMap[idx + 1];
      const below = countryMap[idx + width];
      
      if (current === 255) continue;
      
      if ((right !== 255 && current !== right) || (below !== 255 && current !== below)) {
        const pi = idx * 4;
        pixelData[pi] = 255;
        pixelData[pi + 1] = 255;
        pixelData[pi + 2] = 255;
        pixelData[pi + 3] = 200;
      }
    }
  }
}

/**
 * Generates a full terrain map from a seed.
 * Pure and deterministic — same seed always produces the same terrain.
 */
export function generateTerrainMap(seed: number, width = 1000, height = 700): TerrainMap {
  const rng = createRng(seed);

  // Create noise functions
  const noise1 = createNoise2D(() => rng.next());
  const noise2 = createNoise2D(() => rng.next());
  const moistureNoise1 = createNoise2D(() => rng.next());
  const moistureNoise2 = createNoise2D(() => rng.next());
  // Extra noise for continent mask perturbation
  const maskNoise = createNoise2D(() => rng.next());

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
      const rawElevation = (e1 * 0.7 + e2 * 0.3) * 0.5 + 0.5; // normalize to 0–1

      // Apply continent mask with noise perturbation
      const maskPerturbation = maskNoise(x * 0.005, y * 0.005);
      const mask = continentMask(x, y, width, height, maskPerturbation);
      const elevation = rawElevation * mask;

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

  // Generate country map via Voronoi
  const countryMap = generateCountryMap(seed, width, height, heightmap);
  
  // Render country borders into pixel data
  renderCountryBorders(pixelData, countryMap, width, height);

  return { width, height, heightmap, moisturemap, biomeMap, pixelData, countryMap };
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

/**
 * Get the country index for a given position from the terrain's countryMap.
 */
export function getCountryAtPosition(terrain: TerrainMap, x: number, y: number): number {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || px >= terrain.width || py < 0 || py >= terrain.height) return 255;
  return terrain.countryMap[py * terrain.width + px];
}

/**
 * Compute approximate bounds of a country from its pixel territory.
 * Returns bounding box of all pixels belonging to that country index.
 */
export function computeCountryBounds(
  terrain: TerrainMap,
  countryIndex: number,
): { x: number; y: number; width: number; height: number } {
  let minX = terrain.width, maxX = 0, minY = terrain.height, maxY = 0;
  for (let y = 0; y < terrain.height; y++) {
    for (let x = 0; x < terrain.width; x++) {
      if (terrain.countryMap[y * terrain.width + x] === countryIndex) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
