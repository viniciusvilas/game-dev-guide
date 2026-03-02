// Iron Contract — Soldiers Screen

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Soldier, SoldierAttributes } from '@/types/soldier';
import { getMasteryLevel } from '@/lib/progression/weaponMasterySystem';

const ATTR_LABELS: Record<keyof SoldierAttributes, string> = {
  combat: 'Combate',
  surveillance: 'Vigilância',
  stealth: 'Furtividade',
  driving: 'Condução',
  medicine: 'Medicina',
  logistics: 'Logística',
};

const WEAPON_CATEGORIES = ['pistol', 'smg', 'assault_rifle', 'precision_rifle', 'shotgun', 'machine_gun'] as const;
const WEAPON_CAT_LABELS: Record<string, string> = {
  pistol: 'Pistola',
  smg: 'Submetralhadora',
  assault_rifle: 'Fuzil',
  precision_rifle: 'Precisão',
  shotgun: 'Escopeta',
  machine_gun: 'Metralhadora',
};

export default function SoldiersScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const [selected, setSelected] = useState<string | null>(null);

  const activeSoldiers = gs.soldiers.filter(s => s.status !== 'dead' && s.status !== 'deserted');
  const deadSoldiers = gs.soldiers.filter(s => s.status === 'dead' || s.status === 'deserted');
  const selectedSoldier = gs.soldiers.find(s => s.id === selected);

  const getWeapon = (id: string | null) => id ? gs.weapons.find(w => w.id === id) : null;
  const getArmor = (id: string | null) => id ? gs.armors.find(a => a.id === id) : null;

  // Available equipment (not equipped by anyone else)
  const equippedWeaponIds = new Set(gs.soldiers.map(s => s.equippedWeaponId).filter(Boolean));
  const equippedArmorIds = new Set(gs.soldiers.map(s => s.equippedArmorId).filter(Boolean));
  const availableWeapons = gs.weapons.filter(w => !equippedWeaponIds.has(w.id) || w.id === selectedSoldier?.equippedWeaponId);
  const availableArmors = gs.armors.filter(a => !equippedArmorIds.has(a.id) || a.id === selectedSoldier?.equippedArmorId);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold font-mono tracking-tight">Soldados ({activeSoldiers.length})</h1>

      <div className="grid grid-cols-3 gap-4">
        {/* Soldier list */}
        <div className="space-y-2">
          {activeSoldiers.map(s => (
            <Card
              key={s.id}
              className={`cursor-pointer transition-colors ${selected === s.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
              onClick={() => setSelected(s.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.rank} • {s.missionsCompleted} missões</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground font-mono">
                  <span>STR {s.stress}</span>
                  <span>MOR {s.morale}</span>
                  <span>XP {s.xp}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {deadSoldiers.length > 0 && (
            <div className="pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Baixas ({deadSoldiers.length})</p>
              {deadSoldiers.map(s => (
                <div key={s.id} className="text-sm text-muted-foreground py-1">
                  {s.name} — {s.status === 'dead' ? 'KIA' : 'Desertou'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Soldier detail */}
        {selectedSoldier ? (
          <div className="col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-mono text-lg flex items-center justify-between">
                  {selectedSoldier.name}
                  <Badge variant="outline">{selectedSoldier.rank}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status bars */}
                <div className="grid grid-cols-2 gap-4">
                  <StatBar label="Stress" value={selectedSoldier.stress} max={100} danger />
                  <StatBar label="Moral" value={selectedSoldier.morale} max={100} />
                  <StatBar label="XP" value={selectedSoldier.xp} max={1000} />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Salário:</span>{' '}
                    <span className="font-mono">${selectedSoldier.salary}/dia</span>
                  </div>
                </div>

                {/* Attributes */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Atributos</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(ATTR_LABELS) as [keyof SoldierAttributes, string][]).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-20">{label}</span>
                        <Progress value={selectedSoldier.attributes[key]} className="h-2 flex-1" />
                        <span className="text-xs font-mono w-8 text-right">{selectedSoldier.attributes[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weapon Mastery */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Maestria de Armas</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {WEAPON_CATEGORIES.map(cat => {
                      const level = getMasteryLevel(selectedSoldier, cat);
                      return (
                        <div key={cat} className="text-xs">
                          <span className="text-muted-foreground">{WEAPON_CAT_LABELS[cat]}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Progress value={level} className="h-1.5 flex-1" />
                            <span className="font-mono w-6 text-right">{level}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Equipamento</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Arma</label>
                      <Select
                        value={selectedSoldier.equippedWeaponId || 'none'}
                        onValueChange={(v) => {
                          if (v === 'none') {
                            dispatch({ type: 'UNEQUIP_WEAPON', soldierId: selectedSoldier.id });
                          } else {
                            dispatch({ type: 'EQUIP_WEAPON', soldierId: selectedSoldier.id, weaponId: v });
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Nenhuma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {availableWeapons.map(w => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name} ({w.condition}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Colete</label>
                      <Select
                        value={selectedSoldier.equippedArmorId || 'none'}
                        onValueChange={(v) => {
                          if (v === 'none') {
                            dispatch({ type: 'UNEQUIP_ARMOR', soldierId: selectedSoldier.id });
                          } else {
                            dispatch({ type: 'EQUIP_ARMOR', soldierId: selectedSoldier.id, armorId: v });
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {availableArmors.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name} ({a.condition}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {selectedSoldier.skills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Habilidades</h3>
                    <div className="flex gap-2">
                      {selectedSoldier.skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="col-span-2 flex items-center justify-center text-muted-foreground text-sm">
            Selecione um soldado para ver detalhes
          </div>
        )}
      </div>
    </div>
  );
}

function StatBar({ label, value, max, danger }: { label: string; value: number; max: number; danger?: boolean }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value}/{max}</span>
      </div>
      <Progress value={pct} className={`h-2 ${danger && pct > 70 ? '[&>div]:bg-destructive' : ''}`} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    available: { label: 'OK', variant: 'default' },
    injured: { label: 'Ferido', variant: 'destructive' },
    on_leave: { label: 'Folga', variant: 'outline' },
    in_training: { label: 'Treinando', variant: 'secondary' },
  };
  const c = config[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={c.variant} className="text-[10px] h-5">{c.label}</Badge>;
}
