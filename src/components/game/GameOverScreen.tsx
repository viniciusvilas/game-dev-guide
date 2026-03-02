// Iron Contract — Game Over Screen

import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';

export default function GameOverScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;

  const reason = gs.gameOver;
  const title = reason === 'bankruptcy' ? 'FALÊNCIA' : 'SEM SOLDADOS';
  const description = reason === 'bankruptcy'
    ? 'A companhia ficou sem fundos. As operações foram encerradas.'
    : 'Todos os soldados foram eliminados ou desertaram. A missão acabou.';
  const emoji = reason === 'bankruptcy' ? '💸' : '💀';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sidebar-background text-sidebar-foreground">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">{emoji}</div>
        <h1 className="text-4xl font-bold font-mono text-destructive tracking-tighter">
          GAME OVER
        </h1>
        <h2 className="text-2xl font-mono text-muted-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>

        <div className="space-y-3 font-mono text-sm text-muted-foreground">
          <p>Sobreviveu {gs.currentDay} dias</p>
          <p>{gs.contractHistory.length} contratos completados</p>
          <p>Reputação final: {gs.reputation.professional}</p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            size="lg"
            className="w-64 font-mono tracking-wider"
            onClick={() => {
              const seed = Math.floor(Math.random() * 2147483647);
              dispatch({ type: 'NEW_GAME', seed, difficulty: gs.difficulty });
            }}
          >
            NOVO JOGO
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-64 font-mono tracking-wider border-sidebar-border text-sidebar-foreground"
            onClick={() => dispatch({ type: 'NAVIGATE', screen: 'title' })}
          >
            MENU PRINCIPAL
          </Button>
        </div>
      </div>
    </div>
  );
}
