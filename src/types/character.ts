// Iron Contract — Character Types (GDD-faithful)

export interface CEO {
  name: string;
  background: string;
  reputation: number;    // 0-100
  companyId: string;
}

export interface GovernmentOfficial {
  id: string;
  name: string;
  title: string;
  countryId: string;
  corruptionLevel: number; // 0-100
  relationWithPlayer: number; // -100 to 100
}
