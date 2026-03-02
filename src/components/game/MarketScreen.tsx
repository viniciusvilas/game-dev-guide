// Iron Contract — Market Screen

import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMarketCatalog, getWeaponRepairCost, getArmorRepairCost } from '@/lib/economy/marketPrices';
import { generateRecruitPool, getRecruitmentCost } from '@/lib/recruitment/recruitmentSystem';
import { ShoppingCart, Wrench, UserPlus } from 'lucide-react';

export default function MarketScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;

  const catalog = getMarketCatalog(gs.seed, gs.currentDay);
  const recruits = generateRecruitPool(gs.seed, gs.currentDay);

  const damagedWeapons = gs.weapons.filter(w => w.condition < 100);
  const damagedArmors = gs.armors.filter(a => a.condition < 100);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold font-mono tracking-tight">Mercado</h1>
        <p className="text-sm text-muted-foreground">Preços variam semanalmente • Saldo: <span className="font-mono text-primary">${gs.finances.balance.toLocaleString()}</span></p>
      </div>

      <Tabs defaultValue="weapons">
        <TabsList className="font-mono">
          <TabsTrigger value="weapons">Armas</TabsTrigger>
          <TabsTrigger value="armors">Coletes</TabsTrigger>
          <TabsTrigger value="repair">Reparos</TabsTrigger>
          <TabsTrigger value="recruits">Recrutas</TabsTrigger>
        </TabsList>

        <TabsContent value="weapons" className="space-y-3 mt-4">
          {catalog.weapons.map(w => (
            <Card key={w.name}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{w.name}</h3>
                  <p className="text-xs text-muted-foreground">Condição: 100% (novo)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold">${w.price.toLocaleString()}</span>
                  <Button
                    size="sm"
                    className="font-mono"
                    disabled={gs.finances.balance < w.price}
                    onClick={() => dispatch({ type: 'BUY_WEAPON', weaponName: w.name })}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                    COMPRAR
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="armors" className="space-y-3 mt-4">
          {catalog.armors.map(a => (
            <Card key={a.name}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{a.name}</h3>
                  <p className="text-xs text-muted-foreground">Condição: 100% (novo)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold">${a.price.toLocaleString()}</span>
                  <Button
                    size="sm"
                    className="font-mono"
                    disabled={gs.finances.balance < a.price}
                    onClick={() => dispatch({ type: 'BUY_ARMOR', armorName: a.name })}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                    COMPRAR
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="repair" className="space-y-3 mt-4">
          <h3 className="text-sm font-medium">Armas danificadas</h3>
          {damagedWeapons.length === 0 && (
            <p className="text-sm text-muted-foreground">Todas as armas estão em perfeito estado.</p>
          )}
          {damagedWeapons.map(w => {
            const cost = getWeaponRepairCost(w.name, gs.seed, gs.currentDay);
            return (
              <Card key={w.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{w.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Condição: <span className={w.condition < 30 ? 'text-destructive' : ''}>{w.condition}%</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono">${cost.toLocaleString()}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-mono"
                      disabled={gs.finances.balance < cost}
                      onClick={() => dispatch({ type: 'REPAIR_WEAPON', weaponId: w.id })}
                    >
                      <Wrench className="w-3.5 h-3.5 mr-1" />
                      REPARAR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <h3 className="text-sm font-medium mt-4">Coletes danificados</h3>
          {damagedArmors.length === 0 && (
            <p className="text-sm text-muted-foreground">Todos os coletes estão em perfeito estado.</p>
          )}
          {damagedArmors.map(a => {
            const cost = getArmorRepairCost(a.name, gs.seed, gs.currentDay);
            return (
              <Card key={a.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{a.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Condição: <span className={a.condition < 30 ? 'text-destructive' : ''}>{a.condition}%</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono">${cost.toLocaleString()}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-mono"
                      disabled={gs.finances.balance < cost}
                      onClick={() => dispatch({ type: 'REPAIR_ARMOR', armorId: a.id })}
                    >
                      <Wrench className="w-3.5 h-3.5 mr-1" />
                      REPARAR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="recruits" className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground">Recrutas disponíveis hoje. O pool renova diariamente.</p>
          {recruits.map(r => {
            const cost = getRecruitmentCost(r);
            const alreadyHired = gs.soldiers.some(s => s.name === r.name);
            return (
              <Card key={r.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{r.name}</h3>
                      <Badge variant="outline" className="text-[10px] h-5">{r.rank}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      COM {r.attributes.combat} • VIG {r.attributes.surveillance} • FUR {r.attributes.stealth} •
                      Salário: ${r.salary}/dia
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold">${cost.toLocaleString()}</span>
                    <Button
                      size="sm"
                      className="font-mono"
                      disabled={gs.finances.balance < cost || alreadyHired}
                      onClick={() => dispatch({ type: 'HIRE_RECRUIT', soldier: r })}
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      {alreadyHired ? 'CONTRATADO' : 'CONTRATAR'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
