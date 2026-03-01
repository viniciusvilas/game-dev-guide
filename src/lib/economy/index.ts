// Iron Contract — Economy Module Barrel Export

export { calculateContractReward, createRewardTransaction } from './contractRewards';
export { updateReputation, calculateReputationBonus } from './reputationEngine';
export {
  calculateDailySalaries,
  createSalaryTransactions,
  calculateDailyMaintenance,
  calculateMedicalCosts,
  processDailyTick,
  applyTransactions,
  createInitialFinances,
} from './financeEngine';
export {
  getWeaponPrice,
  getArmorPrice,
  getMarketCatalog,
  getWeaponRepairCost,
  getArmorRepairCost,
} from './marketPrices';
