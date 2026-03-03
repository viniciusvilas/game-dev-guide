// Iron Contract — World Generator (pure, deterministic)

import type { WorldData, WorldSeed, Country, Region, City, CitySize, POI, POIType, MapBounds, MapPosition } from '@/types/world';
import type { SeededRng } from './seededRandom';
import { createRng } from './seededRandom';
import { generateCountryName, generateRegionName, generateCityName, generatePOIName } from './nameGenerator';
import { generateTerrainMap, stampUrbanAreas, isLandPosition, type TerrainMap } from './terrainGenerator';

const POI_TYPES: POIType[] = [
  'private_company', 'government_area', 'airport', 'conflict_zone',
  'private_base', 'national_military_base', 'vip_residence',
  'terrorist_base', 'transport_hub',
];

const CITY_SIZES: CitySize[] = ['small', 'medium', 'large'];

const COUNTRY_COLORS = ['#3b82f6', '#ef4444']; // blue, red

const COUNTRY_BOUNDS: MapBounds[] = [
  { x: 0, y: 0, width: 500, height: 700 },
  { x: 520, y: 0, width: 480, height: 700 },
];

/** Check if pos is at least minDist from all existing positions */
function isPositionValid(pos: MapPosition, existing: MapPosition[], minDist: number): boolean {
  for (const e of existing) {
    const dx = pos.x - e.x;
    const dy = pos.y - e.y;
    if (dx * dx + dy * dy < minDist * minDist) return false;
  }
  return true;
}

/** Generate a valid city position within bounds, on land only */
function generateCityPosition(
  rng: SeededRng,
  bounds: MapBounds,
  existing: MapPosition[],
  minDist: number,
  terrain: TerrainMap,
): MapPosition {
  const padding = 30;
  // With continent mask, center of map has more land - expand search area
  for (let attempt = 0; attempt < 500; attempt++) {
    const pos: MapPosition = {
      x: rng.nextInt(bounds.x + padding, bounds.x + bounds.width - padding),
      y: rng.nextInt(bounds.y + padding, bounds.y + bounds.height - padding),
    };
    if (isLandPosition(terrain, pos.x, pos.y) && isPositionValid(pos, existing, minDist)) {
      return pos;
    }
  }
  // Fallback: relax distance constraint
  for (let attempt = 0; attempt < 500; attempt++) {
    const pos: MapPosition = {
      x: rng.nextInt(bounds.x + padding, bounds.x + bounds.width - padding),
      y: rng.nextInt(bounds.y + padding, bounds.y + bounds.height - padding),
    };
    if (isLandPosition(terrain, pos.x, pos.y)) return pos;
  }
  // Last resort: place near center of map where land is most likely
  const cx = Math.floor(terrain.width / 2) + rng.nextInt(-100, 100);
  const cy = Math.floor(terrain.height / 2) + rng.nextInt(-100, 100);
  return { x: cx, y: cy };
}

function generatePOI(rng: SeededRng, cityId: string): POI {
  return {
    id: `poi-${rng.nextInt(100000, 999999)}`,
    name: generatePOIName(rng),
    type: rng.pick(POI_TYPES),
    cityId,
    controlledByFactionId: null,
    dangerLevel: rng.nextInt(1, 10),
  };
}

function generateCity(
  rng: SeededRng,
  regionId: string,
  size: CitySize,
  regionBounds: MapBounds,
  allPositions: MapPosition[],
  terrain: TerrainMap,
): City {
  const cityId = `city-${rng.nextInt(100000, 999999)}`;
  const poiCount = size === 'large' ? rng.nextInt(3, 5) : size === 'medium' ? rng.nextInt(2, 3) : rng.nextInt(1, 2);
  const pois: POI[] = [];
  for (let i = 0; i < poiCount; i++) {
    pois.push(generatePOI(rng, cityId));
  }

  const mapPosition = generateCityPosition(rng, regionBounds, allPositions, 40, terrain);
  allPositions.push(mapPosition);

  return {
    id: cityId,
    name: generateCityName(rng),
    regionId,
    size,
    population: size === 'large' ? rng.nextInt(500000, 2000000)
      : size === 'medium' ? rng.nextInt(100000, 499999)
      : rng.nextInt(10000, 99999),
    stability: rng.nextInt(20, 80),
    controlledByFactionId: null,
    pois,
    mapPosition,
    poiType: rng.pick(POI_TYPES),
  };
}

function divideRegionBounds(countryBounds: MapBounds, regionCount: number, regionIndex: number): MapBounds {
  const regionHeight = Math.floor(countryBounds.height / regionCount);
  return {
    x: countryBounds.x,
    y: countryBounds.y + regionIndex * regionHeight,
    width: countryBounds.width,
    height: regionHeight,
  };
}

function generateRegion(
  rng: SeededRng,
  countryId: string,
  regionBounds: MapBounds,
  allPositions: MapPosition[],
  terrain: TerrainMap,
): Region {
  const regionId = `region-${rng.nextInt(100000, 999999)}`;
  const cityCount = rng.nextInt(2, 4);
  const cities: City[] = [];

  cities.push(generateCity(rng, regionId, 'large', regionBounds, allPositions, terrain));
  for (let i = 1; i < cityCount; i++) {
    cities.push(generateCity(rng, regionId, rng.pick(CITY_SIZES), regionBounds, allPositions, terrain));
  }

  return {
    id: regionId,
    name: generateRegionName(rng),
    countryId,
    cities,
    mapBounds: regionBounds,
  };
}

function generateCountry(rng: SeededRng, index: number, allPositions: MapPosition[], terrain: TerrainMap): Country {
  const countryId = `country-${rng.nextInt(100000, 999999)}`;
  const countryBounds = COUNTRY_BOUNDS[index] || { x: index * 520, y: 0, width: 480, height: 700 };
  const regionCount = rng.nextInt(2, 3);
  const regions: Region[] = [];

  for (let i = 0; i < regionCount; i++) {
    const regionBounds = divideRegionBounds(countryBounds, regionCount, i);
    regions.push(generateRegion(rng, countryId, regionBounds, allPositions, terrain));
  }

  return {
    id: countryId,
    name: generateCountryName(rng, index),
    regions,
    mapBounds: countryBounds,
    color: COUNTRY_COLORS[index] || '#888888',
  };
}

/**
 * Generates the entire world from a seed.
 * Pure and deterministic — same seed always produces the same world.
 * Also generates terrain and stamps urban areas around cities.
 */
export function generateWorld(seed: WorldSeed): { world: WorldData; terrainMap: TerrainMap } {
  const rng = createRng(seed.value);
  const allPositions: MapPosition[] = [];

  // Generate terrain first
  const terrainMap = generateTerrainMap(seed.value, 1000, 700);

  const countries: Country[] = [];
  for (let i = 0; i < 2; i++) {
    countries.push(generateCountry(rng, i, allPositions, terrainMap));
  }

  // Stamp urban biome around all city positions
  stampUrbanAreas(terrainMap, allPositions, 8);

  const world: WorldData = {
    seed,
    countries,
    timeOfDay: 'day',
  };

  return { world, terrainMap };
}
