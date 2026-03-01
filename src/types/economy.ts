// Iron Contract — Economy Types (GDD-faithful)

export type TransactionType =
  | 'contract_reward'
  | 'salary_payment'
  | 'equipment_purchase'
  | 'equipment_repair'
  | 'base_upgrade'
  | 'recruitment'
  | 'medical'
  | 'penalty'
  | 'other';

export interface DailyTransaction {
  id: string;
  day: number;
  type: TransactionType;
  amount: number;       // positive = income, negative = expense
  description: string;
  relatedEntityId?: string;
}

export interface FinanceRecord {
  currentFunds: number;
  dailyIncome: number;
  dailyExpenses: number;
  transactions: DailyTransaction[];
}
