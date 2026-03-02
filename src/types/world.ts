// Iron Contract — World Types (GDD-faithful)

export type CitySize = 'small' | 'medium' | 'large';

export type POIType =
  | 'private_company'
  | 'government_area'
  | 'airport'
  | 'conflict_zone'
  | 'private_base'
  | 'national_military_base'
  | 'vip_residence'
  | 'terrorist_base'
  | 'transport_hub';

export interface MapPosition {
  x: number;
  y: number;
}

export interface MapBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
  mapPosition: MapPosition;
  poiType: POIType;
}

export interface Region {
  id: string;
  name: string;
  countryId: string;
  cities: City[];
  mapBounds: MapBounds;
}

export interface Country {
  id: string;
  name: string;
  regions: Region[];
  mapBounds: MapBounds;
  color: string; // hex color for map rendering
}

export interface WorldData {
  seed: WorldSeed;
  countries: Country[]; // exactly 2 in MVP
  timeOfDay: 'day' | 'night';
}
