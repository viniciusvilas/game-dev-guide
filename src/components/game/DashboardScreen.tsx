// Iron Contract — Dashboard Screen

import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
  Play,
  TrendingUp,
  TrendingDown,
  Shield,
} from 'lucide-react';

export default function DashboardScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;

  const activeSoldiers = gs.soldiers.filter(s => s.status !== 'dead' && s.status !== 'deserted');
  const availableSoldiers = gs.soldiers.filter(s => s.status === 'available');
  const injuredSoldiers = gs.soldiers.filter(s => s.status === 'injured');
  const criticalEvents = gs.events.filter(e => !e.resolved && e.priority === 'critical');
  const highEvents = gs.events.filter(e => !e.resolved && e.priority === 'high');

  const hasCriticalEvents = criticalEvents.length > 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">{gs.company.name}</h1>
          <p className="text-muted-foreground text-sm">
            Dia {gs.currentDay} • {gs.world.timeOfDay === 'day' ? 'Diurno' : 'Noturno'} •
            Dificuldade: {gs.difficulty}
          </p>
        </div>
        <Button
          size="lg"
          className="font-mono tracking-wider gap-2"
          onClick={() => dispatch({ type: 'ADVANCE_DAY' })}
          disabled={hasCriticalEvents}
        >
          <Play className="w-4 h-4" />
          AVANÇAR DIA
        </Button>
      </div>

      {/* Critical events warning */}
      {hasCriticalEvents && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Eventos críticos pendentes</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Resolva antes de avançar o dia.
                </p>
                <ul className="mt-2 space-y-1">
                  {criticalEvents.map(e => (
                    <li key={e.id} className="text-sm">• {e.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Saldo</div>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-bold font-mono mt-1 ${gs.finances.balance < 5000 ? 'text-destructive' : ''}`}>
              ${gs.finances.balance.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              {gs.finances.monthlyProfit >= 0 ? (
                <span className="text-primary flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />+${gs.finances.monthlyProfit.toLocaleString()}/mês
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />${gs.finances.monthlyProfit.toLocaleString()}/mês
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Soldados</div>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold font-mono mt-1">{activeSoldiers.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {availableSoldiers.length} disponíveis • {injuredSoldiers.length} feridos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Contratos</div>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold font-mono mt-1">{gs.availableContracts.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {gs.contractHistory.length} completados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Reputação</div>
              <Shield className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold font-mono mt-1">{gs.reputation.professional}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Notoriedade: {gs.reputation.notoriety}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Soldiers overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center justify-between">
              Soldados
              <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'soldiers' })}>
                Ver todos →
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeSoldiers.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.name}</span>
                  <Badge variant="outline" className="text-[10px] h-5">{s.rank}</Badge>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
            {activeSoldiers.length > 5 && (
              <p className="text-xs text-muted-foreground">+{activeSoldiers.length - 5} mais</p>
            )}
          </CardContent>
        </Card>

        {/* Contracts overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center justify-between">
              Contratos Disponíveis
              <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'contracts' })}>
                Ver todos →
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {gs.availableContracts.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <div>
                  <span className="font-medium">{c.title}</span>
                  <div className="text-xs text-muted-foreground">
                    Perigo: {c.dangerLevel}/10 • {c.requiredSoldiers} soldados
                  </div>
                </div>
                <span className="font-mono text-primary font-medium">${c.reward.toLocaleString()}</span>
              </div>
            ))}
            {gs.availableContracts.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum contrato disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active events */}
      {highEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent" />
              Eventos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {highEvents.map(e => (
              <div key={e.id} className="text-sm py-1.5 border-b border-border last:border-0">
                <span className="font-medium">{e.title}</span>
                <p className="text-xs text-muted-foreground">{e.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    available: { label: 'Disponível', variant: 'default' },
    on_mission: { label: 'Em missão', variant: 'secondary' },
    injured: { label: 'Ferido', variant: 'destructive' },
    severely_injured: { label: 'Grave', variant: 'destructive' },
    unconscious: { label: 'Inconsciente', variant: 'destructive' },
    in_training: { label: 'Treinando', variant: 'secondary' },
    on_leave: { label: 'De folga', variant: 'outline' },
    dead: { label: 'KIA', variant: 'destructive' },
    deserted: { label: 'Desertou', variant: 'outline' },
  };
  const c = config[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={c.variant} className="text-[10px] h-5">{c.label}</Badge>;
}
