// Iron Contract — Economy Types (GDD v2.0, ticks temporais + finanças)

// === Transaction Types ===

export type TransactionType =
  | 'contract_reward'
  | 'salary_payment'
  | 'equipment_purchase'
  | 'equipment_repair'
  | 'equipment_sale'
  | 'base_upgrade'
  | 'recruitment'
  | 'medical'
  | 'penalty'
  | 'maintenance'
  | 'other';

export interface DailyTransaction {
  id: string;
  day: number;
  type: TransactionType;
  amount: number;       // positive = income, negative = expense
  description: string;
  relatedEntityId?: string;
}

// === Tick System ===

export type TickType = 'daily' | 'weekly' | 'monthly';

export interface GameTick {
  type: TickType;
  day: number;
}

// === Finance Record (per-day snapshot) ===

export interface FinanceRecord {
  day: number;
  income: number;
  expenses: number;
  netChange: number;
  transactions: DailyTransaction[];
}

// === Company Finances (running state) ===

export interface CompanyFinances {
  balance: number;
  dailyBurn: number;        // average daily expenses
  weeklyRevenue: number;    // rolling 7-day income
  monthlyProfit: number;    // rolling 30-day net
  history: FinanceRecord[];
  transactions: DailyTransaction[];
}
