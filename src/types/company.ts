// Iron Contract — Company Types (GDD-faithful)

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Company {
  id: string;
  name: string;
  countryId: string;
  difficulty: Difficulty;
  funds: number;
  dailyExpenses: number;
  foundedDay: number;
}
