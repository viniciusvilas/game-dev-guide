// Iron Contract — Combat Module barrel export

export { resolveCombat } from './combatEngine';
export { calculatePS, calculateDPS, calculateSoldierDPS, calculateEffectiveHP, calculateSquadDPS, calculateFactionDPS, calculateFactionHP, getDistanceModifier, getShelterReduction, getIntelModifier, getApproachModifier, getTimeOfDayModifier, calculatePenetrationFactor, calculateEnemyDPSToSquad } from './damageModel';
export { resolvePhase1, resolvePhase2, resolvePhase3, resolveMomentum } from './momentumEngine';
export { resolveTTKRace, blendResults } from './ttkRace';
export { calculateSurvivalScore, resolveSoldierOutcomes, calculateEquipmentDegradation, determineDamageState } from './combatResolver';
export { generateNarrative } from './narrativeGenerator';
