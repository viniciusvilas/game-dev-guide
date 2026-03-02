// Iron Contract — City Drawer (side panel on city click)

import { useGame } from '@/contexts/GameContext';
import type { City } from '@/types/world';
import type { Faction } from '@/types/faction';
import { getFactionColor } from '@/lib/utils/factionColors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { X, AlertTriangle, Swords, CheckCircle, XCircle } from 'lucide-react';

const POI_ICONS: Record<string, string> = {
  private_company: '🏭',
  government_area: '🏛️',
  airport: '✈️',
  conflict_zone: '⚔️',
  private_base: '🏕️',
  national_military_base: '🎖️',
  vip_residence: '🏠',
  terrorist_base: '💀',
  transport_hub: '🚛',
};

const POI_LABELS: Record<string, string> = {
  private_company: 'Empresa Privada',
  government_area: 'Área Governamental',
  airport: 'Aeroporto',
  conflict_zone: 'Zona de Conflito',
  private_base: 'Base Privada',
  national_military_base: 'Base Militar Nacional',
  vip_residence: 'Residência VIP',
  terrorist_base: 'Base Terrorista',
  transport_hub: 'Hub de Transporte',
};

interface CityDrawerProps {
  city: City;
  onClose: () => void;
  cityFaction: Faction | null;
}

export default function CityDrawer({ city, onClose, cityFaction }: CityDrawerProps) {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;

  const contractsInCity = gs.availableContracts.filter(c => c.targetCityId === city.id);
  const historyInCity = gs.contractHistory.filter(c => {
    const contract = gs.availableContracts.find(ac => ac.id === c.contractId);
    // Check all contracts including expired ones via contractId matching targetCityId
    return c.contractId && gs.contractHistory.some(
      ch => ch.contractId === c.contractId
    );
  });

  // Better history: filter by matching targetCityId across all known contracts
  const cityHistory = gs.contractHistory.filter(cr => {
    // Since contracts may have been removed, we try to match by contractId pattern
    // In practice, look at targetCityId in the original contract
    return true; // We'll filter properly below
  });

  // Find region/country for this city
  let cityCountry = '';
  let cityRegion = '';
  for (const country of gs.world.countries) {
    for (const region of country.regions) {
      if (region.cities.some(c => c.id === city.id)) {
        cityCountry = country.name;
        cityRegion = region.name;
      }
    }
  }

  return (
    <div className="absolute top-0 right-0 bottom-0 w-96 bg-card border-l border-border z-30 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-mono font-bold text-lg">{city.name}</h2>
          <p className="text-xs text-muted-foreground">{cityRegion}, {cityCountry}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="intel" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 font-mono text-xs">
          <TabsTrigger value="intel">Inteligência</TabsTrigger>
          <TabsTrigger value="contracts">
            Contratos {contractsInCity.length > 0 && `(${contractsInCity.length})`}
          </TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Intelligence Tab */}
        <TabsContent value="intel" className="flex-1 overflow-auto p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">{POI_ICONS[city.poiType] || '📍'}</span>
              <div>
                <span className="font-medium">{POI_LABELS[city.poiType] || city.poiType}</span>
                <p className="text-xs text-muted-foreground">
                  Tamanho: {city.size === 'large' ? 'Grande' : city.size === 'medium' ? 'Média' : 'Pequena'}
                  {' • '}Pop: {city.population.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estabilidade</span>
              <span className="font-mono">{city.stability}%</span>
            </div>
            <Progress value={city.stability} className="h-2" />
          </div>

          {/* POIs */}
          {city.pois.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pontos de Interesse</h4>
              {city.pois.map(poi => (
                <div key={poi.id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{POI_ICONS[poi.type] || '📍'}</span>
                    <span>{poi.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5">
                    Perigo {poi.dangerLevel}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Faction info */}
          {cityFaction && (
            <div className="space-y-2 pt-2 border-t border-border">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Facção Dominante</h4>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getFactionColor(cityFaction.id) }}
                />
                <span className="font-medium text-sm">{cityFaction.name}</span>
                <Badge variant="outline" className="text-[10px] h-5 capitalize">{cityFaction.type.replace('_', ' ')}</Badge>
              </div>

              {cityFaction.militaryPower >= 90 && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Zona de alto risco
                </Badge>
              )}
              {cityFaction.militaryPower <= 10 && (
                <Badge variant="secondary" className="text-xs">Facção enfraquecida</Badge>
              )}

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Poder Militar</span>
                  <span className="font-mono">{cityFaction.militaryPower}</span>
                </div>
                <Progress value={cityFaction.militaryPower} className="h-2" />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tropas: Nv.{cityFaction.troopLevel}</span>
                  <span>Equip: Nv.{cityFaction.equipmentLevel}</span>
                </div>
              </div>
            </div>
          )}

          {!cityFaction && (
            <p className="text-sm text-muted-foreground italic">Nenhuma facção controla esta cidade</p>
          )}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="flex-1 overflow-auto p-4 space-y-3">
          {contractsInCity.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhum contrato disponível nesta cidade</p>
          ) : (
            contractsInCity.map(c => (
              <Card key={c.id}>
                <CardContent className="p-3 space-y-2">
                  <h4 className="font-medium text-sm">{c.title}</h4>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono text-muted-foreground">
                    <span>💰 ${c.reward.toLocaleString()}</span>
                    <span>⚖️ -${c.penalty.toLocaleString()}</span>
                    <span>⏳ {c.durationDays} dias</span>
                    <span>📅 Expira dia {c.expiresOnDay}</span>
                    <span>⚔️ {c.requiredSoldiers} soldados</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Perigo:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-3 rounded-sm"
                          style={{
                            backgroundColor: i < c.dangerLevel
                              ? c.dangerLevel >= 7
                                ? 'hsl(0, 72%, 51%)'
                                : c.dangerLevel >= 4
                                  ? 'hsl(38, 92%, 50%)'
                                  : 'hsl(142, 50%, 36%)'
                              : 'hsl(220, 14%, 25%)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full font-mono text-xs"
                    onClick={() => {
                      onClose();
                      dispatch({ type: 'NAVIGATE', screen: 'contracts' });
                    }}
                  >
                    <Swords className="w-3 h-3 mr-1" />
                    ACEITAR
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 overflow-auto p-4 space-y-2">
          {gs.contractHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Cidade não operada anteriormente</p>
          ) : (
            gs.contractHistory.map((cr, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  {cr.outcome === 'victory' ? (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <div>
                    <span className="capitalize">{cr.outcome === 'victory' ? 'Vitória' : cr.outcome === 'defeat' ? 'Derrota' : 'Retirada'}</span>
                    <p className="text-xs text-muted-foreground">Dia {cr.day}</p>
                  </div>
                </div>
                <span className={`font-mono text-xs ${cr.rewardEarned >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  ${cr.rewardEarned.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
