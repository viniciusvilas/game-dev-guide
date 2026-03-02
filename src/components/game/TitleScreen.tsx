// Iron Contract — Title Screen

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { loadGame } from '@/lib/persistence/storage';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Difficulty } from '@/types/company';

export default function TitleScreen() {
  const { dispatch } = useGame();
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const savedGame = loadGame();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sidebar-background text-sidebar-foreground">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tighter font-mono text-primary">
            IRON CONTRACT
          </h1>
          <p className="text-lg text-muted-foreground tracking-widest uppercase">
            Private Military Company Simulator
          </p>
        </div>

        <div className="space-y-4 w-72 mx-auto">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground uppercase tracking-wider">Dificuldade</label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Fácil — $80k, 8 soldados</SelectItem>
                <SelectItem value="normal">Normal — $50k, 6 soldados</SelectItem>
                <SelectItem value="hard">Difícil — $30k, 4 soldados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full h-12 text-lg font-mono tracking-wider"
            onClick={() => {
              const seed = Math.floor(Math.random() * 2147483647);
              dispatch({ type: 'NEW_GAME', seed, difficulty });
            }}
          >
            NOVO JOGO
          </Button>

          {savedGame && (
            <Button
              variant="outline"
              className="w-full h-12 font-mono tracking-wider border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => dispatch({ type: 'LOAD_GAME', state: savedGame })}
            >
              CONTINUAR — Dia {savedGame.currentDay}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-12">
          v0.9 — Todas as decisões são permanentes
        </p>
      </div>
    </div>
  );
}
