// Iron Contract — Contracts Screen (select → allocate → execute → report)

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { validateMission } from '@/lib/missions/missionValidator';
import type { Contract, MissionApproach } from '@/types/contract';
import type { MissionResult } from '@/types/mission';
import { AlertTriangle, CheckCircle, XCircle, Swords, ArrowLeft } from 'lucide-react';

type Phase = 'list' | 'allocate' | 'report';

export default function ContractsScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const [phase, setPhase] = useState<Phase>(state.lastMissionResult ? 'report' : 'list');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedSoldierIds, setSelectedSoldierIds] = useState<string[]>([]);
  const [approach, setApproach] = useState<MissionApproach>('frontal');

  const availableSoldiers = gs.soldiers.filter(s => s.status === 'available');

  const toggleSoldier = (id: string) => {
    setSelectedSoldierIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const startMission = (contract: Contract) => {
    setSelectedContract(contract);
    setSelectedSoldierIds([]);
    setApproach('frontal');
    setPhase('allocate');
  };

  const executeMission = () => {
    if (!selectedContract) return;
    dispatch({
      type: 'EXECUTE_MISSION',
      contract: selectedContract,
      soldierIds: selectedSoldierIds,
      approach,
    });
    setPhase('report');
  };

  const validation = selectedContract
    ? validateMission(
        selectedContract,
        gs.soldiers.filter(s => selectedSoldierIds.includes(s.id)),
        gs.currentDay,
      )
    : null;

  // === LIST PHASE ===
  if (phase === 'list') {
    return (
      <div className="p-6 space-y-6 max-w-6xl">
        <h1 className="text-2xl font-bold font-mono tracking-tight">Contratos</h1>

        <div className="grid grid-cols-2 gap-4">
          {gs.availableContracts.map(c => (
            <Card key={c.id} className="hover:ring-1 hover:ring-primary/50 transition-all">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{c.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                  </div>
                  <Badge variant={c.dangerLevel >= 7 ? 'destructive' : 'outline'}>
                    Perigo {c.dangerLevel}/10
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                  <span>💰 ${c.reward.toLocaleString()}</span>
                  <span>⚔️ {c.requiredSoldiers} soldados</span>
                  <span>⏳ Expira dia {c.expiresOnDay}</span>
                </div>
                <Button
                  size="sm"
                  className="w-full font-mono"
                  onClick={() => startMission(c)}
                  disabled={availableSoldiers.length < c.requiredSoldiers}
                >
                  <Swords className="w-3.5 h-3.5 mr-1.5" />
                  ACEITAR MISSÃO
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* History */}
        {gs.contractHistory.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-mono">Histórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {gs.contractHistory.slice(-5).reverse().map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    {r.outcome === 'victory' ? (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span>Contrato — Dia {r.day}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className={r.rewardEarned >= 0 ? 'text-primary' : 'text-destructive'}>
                      ${r.rewardEarned.toLocaleString()}
                    </span>
                    {r.casualtyIds.length > 0 && (
                      <span className="text-destructive">{r.casualtyIds.length} KIA</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // === ALLOCATE PHASE ===
  if (phase === 'allocate' && selectedContract) {
    return (
      <div className="p-6 space-y-6 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => setPhase('list')} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">{selectedContract.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{selectedContract.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm font-mono">
          <Card><CardContent className="p-3 text-center">
            <div className="text-muted-foreground text-xs">Recompensa</div>
            <div className="text-lg font-bold text-primary">${selectedContract.reward.toLocaleString()}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <div className="text-muted-foreground text-xs">Perigo</div>
            <div className="text-lg font-bold">{selectedContract.dangerLevel}/10</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <div className="text-muted-foreground text-xs">Mínimo</div>
            <div className="text-lg font-bold">{selectedContract.requiredSoldiers} soldados</div>
          </CardContent></Card>
        </div>

        {/* Approach */}
        <div>
          <label className="text-sm font-medium">Abordagem</label>
          <Select value={approach} onValueChange={v => setApproach(v as MissionApproach)}>
            <SelectTrigger className="mt-1 w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frontal">Frontal — Força bruta</SelectItem>
              <SelectItem value="stealth">Furtivo — Bônus surpresa</SelectItem>
              <SelectItem value="quick">Rápido — Entrada e saída</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Squad Selection */}
        <div>
          <h3 className="text-sm font-medium mb-2">
            Selecionar Squad ({selectedSoldierIds.length}/{selectedContract.requiredSoldiers}+)
          </h3>
          <div className="space-y-2">
            {availableSoldiers.map(s => {
              const weapon = s.equippedWeaponId ? gs.weapons.find(w => w.id === s.equippedWeaponId) : null;
              const armor = s.equippedArmorId ? gs.armors.find(a => a.id === s.equippedArmorId) : null;
              const hasGear = !!weapon && !!armor;

              return (
                <Card
                  key={s.id}
                  className={`cursor-pointer transition-colors ${!hasGear ? 'opacity-50' : ''} ${
                    selectedSoldierIds.includes(s.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => hasGear && toggleSoldier(s.id)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <Checkbox checked={selectedSoldierIds.includes(s.id)} disabled={!hasGear} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{s.name}</span>
                        <Badge variant="outline" className="text-[10px] h-5">{s.rank}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        COM {s.attributes.combat} • STR {s.stress} • MOR {s.morale}
                        {weapon && ` • ${weapon.name}`}
                        {!hasGear && ' • ⚠️ Sem equipamento'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Validation errors */}
        {validation && !validation.valid && selectedSoldierIds.length > 0 && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="p-3 space-y-1">
              {validation.errors.map((e, i) => (
                <p key={i} className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> {e}
                </p>
              ))}
              {validation.soldierErrors.map(se => (
                <p key={se.soldierId} className="text-sm text-destructive">
                  {se.soldierName}: {se.errors.join(', ')}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        <Button
          size="lg"
          className="w-full font-mono tracking-wider"
          disabled={!validation?.valid}
          onClick={executeMission}
        >
          <Swords className="w-4 h-4 mr-2" />
          EXECUTAR MISSÃO
        </Button>
      </div>
    );
  }

  // === REPORT PHASE ===
  const result = state.lastMissionResult;
  if (phase === 'report' && result) {
    const isVictory = result.combatResult.outcome === 'victory';
    return (
      <div className="p-6 space-y-6 max-w-4xl">
        <div className={`text-center py-8 rounded-lg ${isVictory ? 'bg-primary/10' : 'bg-destructive/10'}`}>
          <div className="text-4xl mb-2">{isVictory ? '🏆' : '💀'}</div>
          <h1 className={`text-3xl font-bold font-mono ${isVictory ? 'text-primary' : 'text-destructive'}`}>
            {result.combatResult.outcome === 'victory' ? 'VITÓRIA' :
             result.combatResult.outcome === 'defeat' ? 'DERROTA' : 'RETIRADA'}
          </h1>
          <p className="text-muted-foreground mt-2">{result.combatResult.narrative}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 font-mono text-sm">
          <Card><CardContent className="p-3 text-center">
            <div className="text-muted-foreground text-xs">Momentum</div>
            <div className="text-lg font-bold">{result.combatResult.momentumFinal}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <div className="text-muted-foreground text-xs">Baixas inimigas</div>
            <div className="text-lg font-bold">{result.combatResult.enemyCasualtiesEstimate}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <div className="text-muted-foreground text-xs">Recompensa</div>
            <div className={`text-lg font-bold ${result.transactions[0]?.amount >= 0 ? 'text-primary' : 'text-destructive'}`}>
              ${result.transactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </div>
          </CardContent></Card>
        </div>

        {/* Soldier results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono">Resultados por Soldado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.combatResult.soldierResults.map(sr => {
              const soldier = gs.soldiers.find(s => s.id === sr.soldierId);
              const xp = result.xpGained[sr.soldierId] || 0;
              const rankUp = result.rankUps[sr.soldierId];
              return (
                <div key={sr.soldierId} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={sr.damageState === 'dead' ? 'line-through text-muted-foreground' : ''}>
                      {soldier?.name || sr.soldierId}
                    </span>
                    <DamageStateBadge state={sr.damageState} />
                    {rankUp && <Badge className="text-[10px] h-5 bg-accent text-accent-foreground">↑ {rankUp}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                    <span>DMG {sr.damageDealt}</span>
                    <span>+{xp} XP</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Combat phases */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono">Fases do Combate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.combatResult.phases.map((p, i) => (
              <div key={i} className="text-sm py-2 border-b border-border last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{p.phase}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    Momentum: {p.momentumShift > 0 ? '+' : ''}{p.momentumShift}
                  </span>
                </div>
                {p.events.map((evt, j) => (
                  <p key={j} className="text-xs text-muted-foreground mt-0.5">• {evt}</p>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        <Button className="w-full font-mono" onClick={() => { setPhase('list'); }}>
          CONTINUAR
        </Button>
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-6">
      <Button onClick={() => setPhase('list')}>Voltar aos contratos</Button>
    </div>
  );
}

function DamageStateBadge({ state }: { state: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    healthy: { label: 'Ileso', variant: 'default' },
    light_wound: { label: 'Ferido leve', variant: 'outline' },
    heavy_wound: { label: 'Ferido grave', variant: 'destructive' },
    critical: { label: 'Crítico', variant: 'destructive' },
    dead: { label: 'KIA', variant: 'destructive' },
  };
  const c = config[state] || { label: state, variant: 'outline' as const };
  return <Badge variant={c.variant} className="text-[10px] h-5">{c.label}</Badge>;
}
