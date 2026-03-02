// Iron Contract — Game Over Screen

import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';

export default function GameOverScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;

  const reason = gs.gameOver;
  const title = reason === 'bankruptcy' ? 'FALÊNCIA' : 'SEM OPERADORES';
  const description = reason === 'bankruptcy'
    ? 'A companhia ficou sem fundos. As operações foram encerradas.'
    : 'Todos os soldados foram eliminados ou desertaram. A missão acabou.';
  const emoji = reason === 'bankruptcy' ? '💸' : '💀';

  const missionsCompleted = gs.contractHistory.filter(c => c.outcome === 'victory').length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sidebar-background text-sidebar-foreground">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">{emoji}</div>
        <h1 className="text-4xl font-bold font-mono text-destructive tracking-tighter">
          GAME OVER
        </h1>
        <h2 className="text-2xl font-mono text-muted-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>

        <div className="space-y-3 font-mono text-sm text-muted-foreground border-t border-sidebar-border pt-4">
          <p>🗓️ Sobreviveu {gs.currentDay} dias</p>
          <p>✅ {missionsCompleted} missões completadas</p>
          <p>📋 {gs.contractHistory.length} contratos totais</p>
          <p>💰 Saldo final: ${gs.finances.balance.toLocaleString()}</p>
          <p>⭐ Reputação: {gs.reputation.professional}</p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            size="lg"
            className="w-64 font-mono tracking-wider"
            onClick={() => dispatch({ type: 'NEW_GAME', seed: gs.seed, difficulty: gs.difficulty })}
          >
            TENTAR NOVAMENTE
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-64 font-mono tracking-wider border-sidebar-border text-sidebar-foreground"
            onClick={() => {
              const seed = Math.floor(Math.random() * 2147483647);
              dispatch({ type: 'NEW_GAME', seed, difficulty: gs.difficulty });
            }}
          >
            NOVO JOGO
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-64 font-mono tracking-wider text-sidebar-foreground"
            onClick={() => dispatch({ type: 'NAVIGATE', screen: 'title' })}
          >
            MENU PRINCIPAL
          </Button>
        </div>
      </div>
    </div>
  );
}
