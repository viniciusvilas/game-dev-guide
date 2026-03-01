// Iron Contract — Name pools for procedural generation
// Pure data + pick functions. All deterministic via SeededRng.

import type { SeededRng } from './seededRandom';

const FIRST_NAMES = [
  'James', 'Viktor', 'Carlos', 'Ahmed', 'Sergei', 'Marco', 'Dmitri', 'Rafael',
  'Hector', 'Ivan', 'Nikolai', 'Oscar', 'Pavel', 'Tomas', 'Andrei', 'Felix',
  'Bruno', 'Diego', 'Emil', 'Franz', 'Gregor', 'Hugo', 'Javier', 'Klaus',
  'Leon', 'Miguel', 'Niko', 'Omar', 'Pedro', 'Rico', 'Stefan', 'Uri',
  'Vasili', 'Werner', 'Yuri', 'Zoran', 'Alexei', 'Boris', 'Cesar', 'Dante',
  'Elena', 'Fatima', 'Greta', 'Helena', 'Irina', 'Julia', 'Katya', 'Lucia',
  'Maya', 'Nadia', 'Olga', 'Petra', 'Rosa', 'Sonia', 'Tanya', 'Vera',
];

const LAST_NAMES = [
  'Volkov', 'Santos', 'Müller', 'Petrov', 'Garcia', 'Ivanov', 'Schmidt',
  'Rodriguez', 'Kuznetsov', 'Fernandez', 'Novak', 'Sokolov', 'Morales',
  'Hoffman', 'Popov', 'Reyes', 'Becker', 'Torres', 'Kozlov', 'Silva',
  'Weber', 'Cruz', 'Morozov', 'Herrera', 'Fischer', 'Vargas', 'Braun',
  'Mendoza', 'Richter', 'Castillo', 'Wagner', 'Ramos', 'Krause', 'Ortega',
  'Schäfer', 'Vega', 'Klein', 'Paredes', 'Lehmann', 'Rojas',
];

const COUNTRY_NAMES = [
  'Kazara', 'Novistán', 'Drazhia', 'Valkoria', 'Sorvenia',
  'Tarkhan', 'Moldravsk', 'Zelinia', 'Krathova', 'Basrova',
];

const REGION_PREFIXES = [
  'North', 'South', 'East', 'West', 'Central', 'Upper', 'Lower', 'Greater',
];

const REGION_NAMES = [
  'Highlands', 'Basin', 'Corridor', 'Province', 'Frontier', 'Delta',
  'Plateau', 'Valley', 'Steppe', 'Reach',
];

const CITY_PREFIXES = [
  'Fort', 'Port', 'New', 'Old', 'San', 'El', 'Al', 'Nova',
];

const CITY_ROOTS = [
  'grad', 'ville', 'burg', 'haven', 'dara', 'mora', 'polis', 'stan',
  'kirk', 'holm', 'field', 'gate', 'cross', 'ridge', 'vale',
];

const POI_NAMES_PREFIX = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf',
  'Hotel', 'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November',
  'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango',
];

const FACTION_NAMES = [
  'Black Dawn', 'Iron Wolves', 'Red Serpent', 'Shadow Front', 'Storm Brigade',
  'Viper Coalition', 'Blood Hawks', 'Steel Legion', 'Night Fury', 'Crimson Guard',
  'Thunder Company', 'Ghost Network', 'Scorpion Syndicate', 'Eagle Militia',
  'Obsidian Order', 'Razor Edge', 'Phoenix Cell', 'Cobra Division',
];

const COMPANY_NAMES = [
  'Blackwater Solutions', 'Aegis Defense Group', 'Titan Security Corp',
  'Cerberus Tactical', 'Vanguard Operations', 'Sentinel PMC',
  'Ironclad Services', 'Apex Strategic', 'Paladin Corp', 'Reaper Ops',
];

const OFFICIAL_TITLES = [
  'Minister of Defense', 'Governor', 'Regional Commander', 'Chief of Intelligence',
  'Secretary of Security', 'Military Attaché', 'Interior Minister',
  'Provincial Governor', 'Defense Attaché', 'Security Advisor',
];

export function generateFullName(rng: SeededRng): string {
  return `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
}

export function generateCountryName(rng: SeededRng, index: number): string {
  return COUNTRY_NAMES[index % COUNTRY_NAMES.length];
}

export function generateRegionName(rng: SeededRng): string {
  return `${rng.pick(REGION_PREFIXES)} ${rng.pick(REGION_NAMES)}`;
}

export function generateCityName(rng: SeededRng): string {
  if (rng.chance(0.5)) {
    return `${rng.pick(CITY_PREFIXES)} ${rng.pick(LAST_NAMES)}`;
  }
  return `${rng.pick(LAST_NAMES)}${rng.pick(CITY_ROOTS)}`;
}

export function generatePOIName(rng: SeededRng): string {
  return `Site ${rng.pick(POI_NAMES_PREFIX)}-${rng.nextInt(100, 999)}`;
}

export function generateFactionName(rng: SeededRng): string {
  return rng.pick(FACTION_NAMES);
}

export function generateCompanyName(rng: SeededRng): string {
  return rng.pick(COMPANY_NAMES);
}

export function generateOfficialTitle(rng: SeededRng): string {
  return rng.pick(OFFICIAL_TITLES);
}
