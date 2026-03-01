// Iron Contract — Finance Engine (GDD v2.0, pure, deterministic)
// Processes daily/weekly/monthly financial ticks.

import type { Soldier } from '@/types/soldier';
import type { GameTick, DailyTransaction, FinanceRecord, CompanyFinances } from '@/types/economy';

// === Salary ===

/** Total daily salary cost for a roster of soldiers */
export function calculateDailySalaries(soldiers: Soldier[]): number {
  return soldiers
    .filter(s => s.status !== 'dead')
    .reduce((sum, s) => sum + s.salary, 0);
}

/** Create salary payment transactions for a given day */
export function createSalaryTransactions(soldiers: Soldier[], day: number): DailyTransaction[] {
  return soldiers
    .filter(s => s.status !== 'dead')
    .map(s => ({
      id: `tx-salary-${s.id}-d${day}`,
      day,
      type: 'salary_payment' as const,
      amount: -s.salary,
      description: `Salário: ${s.name}`,
      relatedEntityId: s.id,
    }));
}

// === Equipment Maintenance ===

/** Daily maintenance cost based on number of active equipment pieces */
export function calculateDailyMaintenance(
  weaponCount: number,
  armorCount: number
): number {
  // Weapons: $5/day each, Armor: $8/day each
  return weaponCount * 5 + armorCount * 8;
}

export function createMaintenanceTransaction(
  weaponCount: number,
  armorCount: number,
  day: number
): DailyTransaction {
  const cost = calculateDailyMaintenance(weaponCount, armorCount);
  return {
    id: `tx-maint-d${day}`,
    day,
    type: 'maintenance',
    amount: -cost,
    description: `Manutenção: ${weaponCount} armas, ${armorCount} coletes`,
  };
}

// === Medical Costs ===

/** Medical cost per injured soldier per day */
export function calculateMedicalCosts(injuredCount: number): number {
  return injuredCount * 50; // $50/day per injured soldier
}

export function createMedicalTransaction(injuredCount: number, day: number): DailyTransaction {
  const cost = calculateMedicalCosts(injuredCount);
  return {
    id: `tx-medical-d${day}`,
    day,
    type: 'medical',
    amount: -cost,
    description: `Tratamento médico: ${injuredCount} operador(es)`,
  };
}

// === Daily Tick ===

export interface DailyTickInput {
  soldiers: Soldier[];
  weaponCount: number;
  armorCount: number;
  injuredCount: number;
  day: number;
}

/** Process a daily tick: salaries, maintenance, medical. Returns transactions for the day. */
export function processDailyTick(input: DailyTickInput): DailyTransaction[] {
  const txs: DailyTransaction[] = [];

  // Salaries
  txs.push(...createSalaryTransactions(input.soldiers, input.day));

  // Maintenance
  if (input.weaponCount > 0 || input.armorCount > 0) {
    txs.push(createMaintenanceTransaction(input.weaponCount, input.armorCount, input.day));
  }

  // Medical
  if (input.injuredCount > 0) {
    txs.push(createMedicalTransaction(input.injuredCount, input.day));
  }

  return txs;
}

// === Apply Transactions to Finances ===

/** Apply a set of transactions to CompanyFinances, returning updated state. Pure. */
export function applyTransactions(
  finances: CompanyFinances,
  transactions: DailyTransaction[],
  day: number
): CompanyFinances {
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const netChange = totalIncome + totalExpenses;

  const record: FinanceRecord = {
    day,
    income: totalIncome,
    expenses: Math.abs(totalExpenses),
    netChange,
    transactions,
  };

  const newBalance = finances.balance + netChange;
  const newHistory = [...finances.history, record];
  const allTx = [...finances.transactions, ...transactions];

  // Recalculate rolling metrics
  const last7 = newHistory.filter(r => r.day > day - 7);
  const last30 = newHistory.filter(r => r.day > day - 30);

  const weeklyRevenue = last7.reduce((s, r) => s + r.income, 0);
  const monthlyProfit = last30.reduce((s, r) => s + r.netChange, 0);
  const dailyBurn = last7.length > 0
    ? last7.reduce((s, r) => s + r.expenses, 0) / last7.length
    : 0;

  return {
    balance: newBalance,
    dailyBurn: Math.round(dailyBurn),
    weeklyRevenue: Math.round(weeklyRevenue),
    monthlyProfit: Math.round(monthlyProfit),
    history: newHistory,
    transactions: allTx,
  };
}

// === Initial Finances ===

export function createInitialFinances(startingBalance: number): CompanyFinances {
  return {
    balance: startingBalance,
    dailyBurn: 0,
    weeklyRevenue: 0,
    monthlyProfit: 0,
    history: [],
    transactions: [],
  };
}
