// Iron Contract — Base Screen

import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getBuildingCost, getBuildingLevel } from '@/lib/base/baseManager';
import type { StructureType } from '@/types/base';
import { Building2, Users, Shield, Stethoscope, Radio } from 'lucide-react';

const STRUCTURE_CONFIG: Record<StructureType, { label: string; icon: typeof Building2; desc: string }> = {
  barracks: { label: 'Alojamento', icon: Users, desc: 'Aumenta capacidade de soldados' },
  armory: { label: 'Armeiro', icon: Shield, desc: 'Aumenta capacidade de equipamento' },
  medical_center: { label: 'Centro Médico', icon: Stethoscope, desc: 'Acelera recuperação de feridos' },
  ops_room: { label: 'Sala de Operações', icon: Radio, desc: 'Melhora inteligência de missão' },
};

export default function BaseScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-mono tracking-tight">Base de Operações</h1>
        <p className="text-sm text-muted-foreground">{gs.base.name} • {gs.base.cityId}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {gs.base.structures.map(structure => {
          const config = STRUCTURE_CONFIG[structure.type];
          const Icon = config.icon;
          const cost = getBuildingCost(structure.type, structure.level);
          const canAfford = gs.finances.balance >= cost;
          const maxLevel = structure.level >= 5;

          return (
            <Card key={structure.type}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{config.label}</h3>
                      <p className="text-xs text-muted-foreground">{config.desc}</p>
                    </div>
                  </div>
                  <span className="font-mono text-lg font-bold text-primary">Nv.{structure.level}</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Nível</span>
                    <span>{structure.level}/5</span>
                  </div>
                  <Progress value={(structure.level / 5) * 100} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacidade: <span className="font-mono">{structure.capacity}</span></span>
                </div>

                <Button
                  variant={maxLevel ? 'outline' : 'default'}
                  size="sm"
                  className="w-full font-mono"
                  disabled={maxLevel || !canAfford}
                  onClick={() => dispatch({ type: 'UPGRADE_BUILDING', buildingType: structure.type })}
                >
                  {maxLevel ? 'NÍVEL MÁXIMO' : `MELHORAR — $${cost.toLocaleString()}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Soldados:</span>{' '}
              <span className="font-mono">
                {gs.soldiers.filter(s => s.status !== 'dead' && s.status !== 'deserted').length}/{gs.base.maxSoldiers}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Armas:</span>{' '}
              <span className="font-mono">{gs.weapons.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Coletes:</span>{' '}
              <span className="font-mono">{gs.armors.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
