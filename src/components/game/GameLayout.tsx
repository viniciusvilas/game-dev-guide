// Iron Contract — Game Layout (sidebar nav + content area)

import type { ReactNode } from 'react';
import { useGame, type Screen } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
  ShoppingCart,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS: { screen: Screen; label: string; icon: typeof LayoutDashboard }[] = [
  { screen: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { screen: 'soldiers', label: 'Soldados', icon: Users },
  { screen: 'contracts', label: 'Contratos', icon: FileText },
  { screen: 'base', label: 'Base', icon: Building2 },
  { screen: 'market', label: 'Mercado', icon: ShoppingCart },
];

export default function GameLayout({ children }: { children: ReactNode }) {
  const { state, dispatch } = useGame();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="font-mono font-bold text-primary text-sm tracking-widest">IRON CONTRACT</h2>
          {state.gameState && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Dia {state.gameState.currentDay} • {state.gameState.world.timeOfDay === 'day' ? '☀️' : '🌙'}
            </p>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map(({ screen, label, icon: Icon }) => (
            <button
              key={screen}
              onClick={() => dispatch({ type: 'NAVIGATE', screen })}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                state.screen === screen
                  ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Finance summary in sidebar */}
        {state.gameState && (
          <div className="p-4 border-t border-sidebar-border space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo</span>
              <span className={state.gameState.finances.balance < 5000 ? 'text-destructive' : 'text-primary'}>
                ${state.gameState.finances.balance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Burn/dia</span>
              <span className="text-muted-foreground">-${state.gameState.finances.dailyBurn.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => dispatch({ type: 'SAVE_GAME' })}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
