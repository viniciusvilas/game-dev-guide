// Iron Contract — Progression System (Etapa 6) barrel export

export {
  calculateSoldierXP,
  applySoldierXP,
} from './xpEngine';

export {
  getNextRank,
  getRankIndex,
  canPromote,
  promote,
  getSkillsUnlockedAtRank,
  getAvailableSkills,
  getRankRequirements,
} from './rankSystem';

export {
  calculateDailyGain,
  createTrainingSession,
  processTraining,
  applyTrainingResult,
  trainingToTransaction,
} from './trainingSystem';
export type { TrainingSession, TrainingResult } from './trainingSystem';

export {
  calculateMasteryGain,
  applyMasteryGain,
  getMasteryLevel,
} from './weaponMasterySystem';
