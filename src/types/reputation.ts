// Iron Contract — Reputation Types (GDD-faithful)

export interface CountryReputation {
  countryId: string;
  value: number; // -100 to 100
}

export interface ReputationData {
  professional: number;    // 0-100, competence perception
  notoriety: number;       // 0-100, public visibility / infamy
  ceoReputation: number;   // 0-100, personal CEO standing
  byCountry: CountryReputation[];
}
