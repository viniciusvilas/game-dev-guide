// Iron Contract — Narrative Generator (GDD v2.0, pure, template-based)
// Converts CombatResult into a readable text narrative. No AI — pure templates.

import type { CombatResult, SoldierCombatResult, DamageState } from '@/types/combat';

/**
 * Generate a narrative text from combat results.
 * Pure function — same input, same output. Template-based, no AI.
 */
export function generateNarrative(result: CombatResult): string {
  const lines: string[] = [];

  // === Opening ===
  lines.push(getOpeningLine(result.outcome, result.momentumFinal));
  lines.push('');

  // === Phase Summaries ===
  for (const phase of result.phases) {
    lines.push(`[${PHASE_NAMES[phase.phase]}]`);
    for (const event of phase.events) {
      lines.push(`  • ${event}`);
    }
    lines.push(`  Dano infligido: ${phase.playerDamageDealt} | Dano recebido: ${phase.playerDamageTaken}`);
    lines.push('');
  }

  // === Casualties ===
  if (result.playerCasualties.length > 0) {
    lines.push(`KIA: ${result.playerCasualties.length} operador(es) perdido(s).`);
  }
  if (result.playerInjured.length > 0) {
    lines.push(`Feridos: ${result.playerInjured.length} operador(es) necessitam tratamento médico.`);
  }

  // === Soldier Highlights ===
  const topDamage = getTopPerformer(result.soldierResults);
  if (topDamage) {
    lines.push(`Destaque: Operador ${topDamage.soldierId} causou ${topDamage.damageDealt} de dano total.`);
  }

  // === Enemy ===
  lines.push(`Baixas inimigas estimadas: ${result.enemyCasualtiesEstimate}`);

  // === Closing ===
  lines.push('');
  lines.push(getClosingLine(result.outcome, result.momentumFinal));

  return lines.join('\n');
}

// === Helpers ===

const PHASE_NAMES: Record<string, string> = {
  engagement: 'Fase 1 — Engajamento',
  firefight: 'Fase 2 — Tiroteio',
  resolution: 'Fase 3 — Resolução',
};

function getOpeningLine(outcome: string, momentum: number): string {
  if (outcome === 'victory' && momentum > 60) {
    return '▸ VITÓRIA DECISIVA — A operação foi um sucesso absoluto.';
  }
  if (outcome === 'victory') {
    return '▸ VITÓRIA — Missão cumprida, mas com resistência significativa.';
  }
  if (outcome === 'defeat' && momentum < -60) {
    return '▸ DERROTA CATASTRÓFICA — A equipe foi esmagada.';
  }
  if (outcome === 'defeat') {
    return '▸ DERROTA — A missão falhou. Reagrupar e reavaliar.';
  }
  return '▸ RETIRADA TÁTICA — A equipe recuou para evitar mais perdas.';
}

function getClosingLine(outcome: string, momentum: number): string {
  if (outcome === 'victory' && momentum > 60) {
    return 'Reputação da companhia elevada. Bônus de contrato disponível.';
  }
  if (outcome === 'victory') {
    return 'Operação concluída. Avalie o estado dos operadores antes da próxima missão.';
  }
  if (outcome === 'defeat') {
    return 'Perdas significativas. Considere melhorar equipamento e treinamento.';
  }
  return 'Reagrupe os operadores e avalie opções alternativas para o contrato.';
}

function getTopPerformer(soldierResults: SoldierCombatResult[]): SoldierCombatResult | null {
  if (soldierResults.length === 0) return null;
  return soldierResults.reduce((top, s) =>
    s.damageDealt > top.damageDealt ? s : top
  );
}
