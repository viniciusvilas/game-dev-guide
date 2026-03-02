// Iron Contract — Main Game Router

import { GameProvider, useGame } from '@/contexts/GameContext';
import TitleScreen from '@/components/game/TitleScreen';
import GameLayout from '@/components/game/GameLayout';
import DashboardScreen from '@/components/game/DashboardScreen';
import SoldiersScreen from '@/components/game/SoldiersScreen';
import ContractsScreen from '@/components/game/ContractsScreen';
import BaseScreen from '@/components/game/BaseScreen';
import MarketScreen from '@/components/game/MarketScreen';
import GameOverScreen from '@/components/game/GameOverScreen';

function GameRouter() {
  const { state } = useGame();

  if (state.screen === 'title' || !state.gameState) {
    return <TitleScreen />;
  }

  if (state.screen === 'gameover') {
    return <GameOverScreen />;
  }

  const screenMap: Record<string, React.ReactNode> = {
    dashboard: <DashboardScreen />,
    soldiers: <SoldiersScreen />,
    contracts: <ContractsScreen />,
    base: <BaseScreen />,
    market: <MarketScreen />,
  };

  return (
    <GameLayout>
      {screenMap[state.screen] || <DashboardScreen />}
    </GameLayout>
  );
}

export default function Index() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
