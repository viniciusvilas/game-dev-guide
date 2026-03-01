// Iron Contract — World Generator (pure, deterministic)

import type { WorldData, WorldSeed, Country, Region, City, CitySize, POI, POIType } from '@/types/world';
import type { SeededRng } from './seededRandom';
import { createRng } from './seededRandom';
import { generateCountryName, generateRegionName, generateCityName, generatePOIName } from './nameGenerator';

const POI_TYPES: POIType[] = [
  'private_company', 'government_area', 'airport', 'conflict_zone',
  'private_base', 'national_military_base', 'vip_residence',
  'terrorist_base', 'transport_hub',
];

const CITY_SIZES: CitySize[] = ['small', 'medium', 'large'];

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

function generateCity(rng: SeededRng, regionId: string, size: CitySize): City {
  const cityId = `city-${rng.nextInt(100000, 999999)}`;
  const poiCount = size === 'large' ? rng.nextInt(3, 5) : size === 'medium' ? rng.nextInt(2, 3) : rng.nextInt(1, 2);
  const pois: POI[] = [];
  for (let i = 0; i < poiCount; i++) {
    pois.push(generatePOI(rng, cityId));
  }

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
  };
}

function generateRegion(rng: SeededRng, countryId: string): Region {
  const regionId = `region-${rng.nextInt(100000, 999999)}`;
  const cityCount = rng.nextInt(2, 4);
  const cities: City[] = [];

  // Ensure at least one large city per region
  cities.push(generateCity(rng, regionId, 'large'));
  for (let i = 1; i < cityCount; i++) {
    cities.push(generateCity(rng, regionId, rng.pick(CITY_SIZES)));
  }

  return {
    id: regionId,
    name: generateRegionName(rng),
    countryId,
    cities,
  };
}

function generateCountry(rng: SeededRng, index: number): Country {
  const countryId = `country-${rng.nextInt(100000, 999999)}`;
  const regionCount = rng.nextInt(2, 3);
  const regions: Region[] = [];

  for (let i = 0; i < regionCount; i++) {
    regions.push(generateRegion(rng, countryId));
  }

  return {
    id: countryId,
    name: generateCountryName(rng, index),
    regions,
  };
}

/**
 * Generates the entire world from a seed.
 * Pure and deterministic — same seed always produces the same world.
 */
export function generateWorld(seed: WorldSeed): WorldData {
  const rng = createRng(seed.value);

  const countries: Country[] = [];
  // MVP: exactly 2 countries
  for (let i = 0; i < 2; i++) {
    countries.push(generateCountry(rng, i));
  }

  return {
    seed,
    countries,
    currentDay: 1,
    timeOfDay: 'day',
  };
}
