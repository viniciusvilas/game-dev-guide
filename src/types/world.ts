// Iron Contract — World Types (GDD-faithful)

export type CitySize = 'small' | 'medium' | 'large';

export type POIType =
  | 'military_base'
  | 'hospital'
  | 'market'
  | 'government'
  | 'warehouse'
  | 'port'
  | 'airport'
  | 'refugee_camp'
  | 'ruins';

export interface WorldSeed {
  value: number;
  timestamp: number;
}

export interface POI {
  id: string;
  name: string;
  type: POIType;
  cityId: string;
  controlledByFactionId: string | null;
  dangerLevel: number; // 1-10
}

export interface City {
  id: string;
  name: string;
  regionId: string;
  size: CitySize;
  population: number;
  stability: number; // 0-100
  controlledByFactionId: string | null;
  pois: POI[];
}

export interface Region {
  id: string;
  name: string;
  countryId: string;
  cities: City[];
}

export interface Country {
  id: string;
  name: string;
  regions: Region[];
}

export interface WorldData {
  seed: WorldSeed;
  countries: Country[]; // exactly 2 in MVP
  currentDay: number;
  timeOfDay: 'day' | 'night';
}
