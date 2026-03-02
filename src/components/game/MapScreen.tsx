// Iron Contract — Map Screen (main game view)

import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import type { City, Country, Region } from '@/types/world';
import type { Faction } from '@/types/faction';
import { getFactionColor } from '@/lib/utils/factionColors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CityDrawer from './CityDrawer';
import {
  Play, DollarSign, Calendar, AlertTriangle, Sun, Moon, Users, Save,
  Map as MapIcon, UserCheck, Building2, ShoppingCart,
} from 'lucide-react';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 600;

export default function MapScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const isNight = gs.world.timeOfDay === 'night';
  const criticalEvents = gs.events.filter(e => !e.resolved && e.priority === 'critical');
  const unresolvedEvents = gs.events.filter(e => !e.resolved);
  const hasCriticalEvents = criticalEvents.length > 0;

  const activeSoldiers = gs.soldiers.filter(s => s.status !== 'dead' && s.status !== 'deserted');
  const availableSoldiers = gs.soldiers.filter(s => s.status === 'available');

  // Build lookup: cityId → dominant faction
  const cityFactionMap = useMemo(() => {
    const map = new Map<string, Faction>();
    for (const f of gs.factions) {
      for (const cityId of f.territory) {
        const existing = map.get(cityId);
        if (!existing || f.militaryPower > existing.militaryPower) {
          map.set(cityId, f);
        }
      }
    }
    return map;
  }, [gs.factions]);

  // Contracts by city
  const contractsByCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of gs.availableContracts) {
      map.set(c.targetCityId, (map.get(c.targetCityId) || 0) + 1);
    }
    return map;
  }, [gs.availableContracts]);

  // All cities flat
  const allCities = useMemo(() => {
    const cities: City[] = [];
    for (const country of gs.world.countries) {
      for (const region of country.regions) {
        for (const city of region.cities) {
          cities.push(city);
        }
      }
    }
    return cities;
  }, [gs.world]);

  const selectedCity = allCities.find(c => c.id === selectedCityId) || null;

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center justify-between p-3 pointer-events-auto">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs gap-1.5 py-1 px-2.5 bg-card/90 backdrop-blur border border-border">
              <Calendar className="w-3.5 h-3.5" />
              Dia {gs.currentDay}
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs gap-1.5 py-1 px-2.5 bg-card/90 backdrop-blur border border-border">
              <DollarSign className="w-3.5 h-3.5" />
              ${gs.finances.balance.toLocaleString()}
              <span className="text-muted-foreground">| Burn: ${gs.finances.dailyBurn.toLocaleString()}/dia</span>
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs gap-1.5 py-1 px-2.5 bg-card/90 backdrop-blur border border-border">
              <Users className="w-3.5 h-3.5" />
              {availableSoldiers.length}/{activeSoldiers.length} operadores
            </Badge>
            {unresolvedEvents.length > 0 && (
              <Badge variant={hasCriticalEvents ? 'destructive' : 'secondary'} className="font-mono text-xs gap-1.5 py-1 px-2.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {unresolvedEvents.length} eventos
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-xs gap-1.5 py-1 px-2.5 bg-card/90 backdrop-blur border border-border">
              {isNight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              {isNight ? 'Noturno' : 'Diurno'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      className="font-mono text-xs gap-1.5"
                      onClick={() => dispatch({ type: 'ADVANCE_DAY' })}
                      disabled={hasCriticalEvents}
                    >
                      <Play className="w-3.5 h-3.5" />
                      AVANÇAR DIA
                    </Button>
                  </span>
                </TooltipTrigger>
                {hasCriticalEvents && (
                  <TooltipContent>Resolva eventos críticos primeiro</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => dispatch({ type: 'SAVE_GAME' })}
            >
              <Save className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Side Navigation */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 p-2">
        {([
          { screen: 'map' as const, icon: MapIcon, label: 'Mapa' },
          { screen: 'soldiers' as const, icon: UserCheck, label: 'Soldados' },
          { screen: 'base' as const, icon: Building2, label: 'Base' },
          { screen: 'market' as const, icon: ShoppingCart, label: 'Mercado' },
        ]).map(({ screen, icon: Icon, label }) => (
          <TooltipProvider key={screen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={state.screen === screen ? 'default' : 'secondary'}
                  size="icon"
                  className="w-10 h-10 bg-card/90 backdrop-blur border border-border"
                  onClick={() => dispatch({ type: 'NAVIGATE', screen })}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {unresolvedEvents.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-10 h-10 bg-card/90 backdrop-blur border border-border relative"
                  onClick={() => dispatch({ type: 'NAVIGATE', screen: 'dashboard' })}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unresolvedEvents.length}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Eventos ({unresolvedEvents.length})</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* SVG Map */}
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="flex-1 w-full h-full"
        style={{
          background: isNight
            ? 'hsl(220, 25%, 5%)'
            : 'hsl(220, 20%, 14%)',
        }}
      >
        {/* Layer 1 — Countries */}
        {gs.world.countries.map(country => (
          <g key={country.id}>
            <rect
              x={country.mapBounds.x}
              y={country.mapBounds.y}
              width={country.mapBounds.width}
              height={country.mapBounds.height}
              fill={country.color}
              fillOpacity={0.12}
              stroke={country.color}
              strokeWidth={2}
              strokeOpacity={0.6}
            />
            <text
              x={country.mapBounds.x + country.mapBounds.width / 2}
              y={country.mapBounds.y + 30}
              textAnchor="middle"
              fill={country.color}
              fillOpacity={0.35}
              fontSize={22}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={700}
              letterSpacing={4}
            >
              {country.name.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Layer 2 — Regions */}
        {gs.world.countries.map(country =>
          country.regions.map(region => (
            <g key={region.id}>
              <rect
                x={region.mapBounds.x}
                y={region.mapBounds.y}
                width={region.mapBounds.width}
                height={region.mapBounds.height}
                fill="none"
                stroke="hsl(220, 14%, 50%)"
                strokeWidth={1}
                strokeOpacity={0.25}
                strokeDasharray="6 4"
              />
              <text
                x={region.mapBounds.x + region.mapBounds.width / 2}
                y={region.mapBounds.y + 18}
                textAnchor="middle"
                fill="hsl(220, 14%, 60%)"
                fillOpacity={0.4}
                fontSize={10}
                fontFamily="'Inter', sans-serif"
              >
                {region.name}
              </text>
            </g>
          ))
        )}

        {/* Layer 3 — Faction Territory (circles behind cities) */}
        {allCities.map(city => {
          const faction = cityFactionMap.get(city.id);
          if (!faction) return null;
          const color = getFactionColor(faction.id);
          const radius = Math.max(20, Math.min(60, faction.militaryPower * 0.6));
          const opacity = (faction.militaryPower / 100) * 0.4;
          const isPulsing = faction.militaryPower >= 80;

          return (
            <circle
              key={`faction-${city.id}`}
              cx={city.mapPosition.x}
              cy={city.mapPosition.y}
              r={radius}
              fill={color}
              fillOpacity={opacity}
              className={isPulsing ? 'animate-faction-pulse' : ''}
            />
          );
        })}

        {/* Layer 4 — Cities */}
        {allCities.map(city => {
          const isBase = city.id === gs.base.cityId;
          const hasContracts = (contractsByCity.get(city.id) || 0) > 0;
          const faction = cityFactionMap.get(city.id);
          const factionColor = faction ? getFactionColor(faction.id) : undefined;
          const contractCount = contractsByCity.get(city.id) || 0;

          return (
            <g
              key={city.id}
              className="cursor-pointer"
              onClick={() => setSelectedCityId(city.id)}
            >
              {/* Faction border ring */}
              {factionColor && (
                <circle
                  cx={city.mapPosition.x}
                  cy={city.mapPosition.y}
                  r={isBase ? 15 : 11}
                  fill="none"
                  stroke={factionColor}
                  strokeWidth={2}
                  strokeOpacity={0.7}
                />
              )}

              {isBase ? (
                <>
                  {/* Player base — gold shield */}
                  <circle
                    cx={city.mapPosition.x}
                    cy={city.mapPosition.y}
                    r={12}
                    fill="hsl(38, 92%, 50%)"
                    fillOpacity={0.9}
                    stroke="hsl(38, 92%, 65%)"
                    strokeWidth={2}
                  />
                  <text
                    x={city.mapPosition.x}
                    y={city.mapPosition.y + 4}
                    textAnchor="middle"
                    fontSize={12}
                    fill="hsl(0, 0%, 100%)"
                  >
                    🛡
                  </text>
                </>
              ) : (
                <circle
                  cx={city.mapPosition.x}
                  cy={city.mapPosition.y}
                  r={8}
                  fill={hasContracts ? 'hsl(38, 92%, 50%)' : 'hsl(0, 0%, 85%)'}
                  fillOpacity={hasContracts ? 0.9 : 0.7}
                  stroke={hasContracts ? 'hsl(38, 92%, 65%)' : 'hsl(0, 0%, 95%)'}
                  strokeWidth={1.5}
                  className={hasContracts ? 'animate-contract-pulse' : ''}
                />
              )}

              {/* Contract indicator */}
              {hasContracts && !isBase && (
                <text
                  x={city.mapPosition.x}
                  y={city.mapPosition.y + 3.5}
                  textAnchor="middle"
                  fontSize={9}
                  fill="hsl(0, 0%, 100%)"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={700}
                >
                  {contractCount}
                </text>
              )}

              {/* City name label */}
              <text
                x={city.mapPosition.x}
                y={city.mapPosition.y + (isBase ? 24 : 20)}
                textAnchor="middle"
                fill="hsl(0, 0%, 80%)"
                fontSize={9}
                fontFamily="'Inter', sans-serif"
                fontWeight={isBase ? 600 : 400}
              >
                {city.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* City Drawer */}
      {selectedCity && (
        <CityDrawer
          city={selectedCity}
          onClose={() => setSelectedCityId(null)}
          cityFaction={cityFactionMap.get(selectedCity.id) || null}
        />
      )}

      {/* Critical Event Modal */}
      {hasCriticalEvents && (
        <CriticalEventModal
          events={criticalEvents}
          onResolve={(id) => dispatch({ type: 'RESOLVE_EVENT', eventId: id })}
        />
      )}
    </div>
  );
}

function CriticalEventModal({
  events,
  onResolve,
}: {
  events: import('@/types/events').GameEvent[];
  onResolve: (id: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const evt = events[currentIndex];
  if (!evt) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-destructive rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="font-mono font-bold text-lg">EVENTO CRÍTICO</h2>
        </div>
        <h3 className="font-medium">{evt.title}</h3>
        <p className="text-sm text-muted-foreground">{evt.description}</p>
        {evt.effects.length > 0 && (
          <div className="text-xs space-y-1 text-muted-foreground border-t border-border pt-2">
            {evt.effects.map((eff, i) => (
              <p key={i}>
                {eff.balanceDelta && `💰 ${eff.balanceDelta > 0 ? '+' : ''}$${eff.balanceDelta}`}
                {eff.stressDelta && ` 😰 Stress ${eff.stressDelta > 0 ? '+' : ''}${eff.stressDelta}`}
                {eff.moraleDelta && ` 💪 Moral ${eff.moraleDelta > 0 ? '+' : ''}${eff.moraleDelta}`}
              </p>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            {currentIndex + 1}/{events.length}
          </span>
          <Button
            size="sm"
            variant="destructive"
            className="font-mono"
            onClick={() => {
              onResolve(evt.id);
              if (currentIndex < events.length - 1) {
                setCurrentIndex(currentIndex + 1);
              }
            }}
          >
            CONFIRMAR
          </Button>
        </div>
      </div>
    </div>
  );
}
