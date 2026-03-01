// Iron Contract — Character Types (GDD v2.0)

export interface CEO {
  name: string;
  sector: string;
  budget: number;
  contractQuality: number; // 1-5
  active: boolean;
  reputation: number;      // 0-100
  companyId: string;
}

export interface GovernmentOfficial {
  id: string;
  name: string;
  title: string;
  countryId: string;
  influenceLevel: number;      // 1-100
  relationWithPlayer: number;  // -100 to 100
}
