// Iron Contract — Map Screen (procedural terrain + SVG overlay + zoom/pan)

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import type { City } from '@/types/world';
import type { Faction } from '@/types/faction';
import { getFactionColor } from '@/lib/utils/factionColors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TerrainCanvas from '@/components/map/TerrainCanvas';
import CityDrawer from './CityDrawer';
import {
  Play, DollarSign, Calendar, AlertTriangle, Sun, Moon, Users, Save,
  Map as MapIcon, UserCheck, Building2, ShoppingCart,
} from 'lucide-react';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 700;

export default function MapScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const isNight = gs.world.timeOfDay === 'night';
  const criticalEvents = gs.events.filter(e => !e.resolved && e.priority === 'critical');
  const unresolvedEvents = gs.events.filter(e => !e.resolved);
  const hasCriticalEvents = criticalEvents.length > 0;

  const activeSoldiers = gs.soldiers.filter(s => s.status !== 'dead' && s.status !== 'deserted');
  const availableSoldiers = gs.soldiers.filter(s => s.status === 'available');

  // City → dominant faction lookup
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

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Reset pan when releasing outside
  useEffect(() => {
    const up = () => setIsPanning(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {/* HUD Overlay */}
      <HudOverlay
        gs={gs}
        isNight={isNight}
        hasCriticalEvents={hasCriticalEvents}
        unresolvedEvents={unresolvedEvents}
        availableSoldiers={availableSoldiers}
        activeSoldiers={activeSoldiers}
        dispatch={dispatch}
        screen={state.screen}
      />

      {/* Side Navigation */}
      <SideNav
        screen={state.screen}
        unresolvedEvents={unresolvedEvents}
        dispatch={dispatch}
      />

      {/* Map Container with zoom/pan */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Terrain Canvas */}
          <TerrainCanvas terrainMap={gs.terrainMap} nightMode={isNight} />

          {/* SVG Overlay */}
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            {/* Country borders */}
            {gs.world.countries.map(country => (
              <g key={country.id}>
                <rect
                  x={country.mapBounds.x}
                  y={country.mapBounds.y}
                  width={country.mapBounds.width}
                  height={country.mapBounds.height}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={2}
                />
                <text
                  x={country.mapBounds.x + country.mapBounds.width / 2}
                  y={country.mapBounds.y + 30}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.25)"
                  fontSize={22}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={700}
                  letterSpacing={4}
                >
                  {country.name.toUpperCase()}
                </text>
              </g>
            ))}

            {/* Region borders */}
            {gs.world.countries.map(country =>
              country.regions.map(region => (
                <g key={region.id}>
                  <rect
                    x={region.mapBounds.x}
                    y={region.mapBounds.y}
                    width={region.mapBounds.width}
                    height={region.mapBounds.height}
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={1}
                    strokeDasharray="6 4"
                  />
                  <text
                    x={region.mapBounds.x + region.mapBounds.width / 2}
                    y={region.mapBounds.y + 18}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.3)"
                    fontSize={10}
                    fontFamily="'Inter', sans-serif"
                  >
                    {region.name}
                  </text>
                </g>
              ))
            )}

            {/* Faction territory circles */}
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

            {/* Cities */}
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
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCityId(city.id);
                  }}
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
                        fill="white"
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

                  {/* Contract count */}
                  {hasContracts && !isBase && (
                    <text
                      x={city.mapPosition.x}
                      y={city.mapPosition.y + 3.5}
                      textAnchor="middle"
                      fontSize={9}
                      fill="white"
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight={700}
                    >
                      {contractCount}
                    </text>
                  )}

                  {/* City name */}
                  <text
                    x={city.mapPosition.x}
                    y={city.mapPosition.y + (isBase ? 24 : 20)}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.8)"
                    fontSize={9}
                    fontFamily="'Inter', sans-serif"
                    fontWeight={isBase ? 600 : 400}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={0.3}
                  >
                    {city.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 z-20">
        <Badge variant="secondary" className="font-mono text-xs bg-card/90 backdrop-blur border border-border">
          {Math.round(zoom * 100)}%
        </Badge>
      </div>

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

// === Sub-components ===

function HudOverlay({
  gs, isNight, hasCriticalEvents, unresolvedEvents, availableSoldiers, activeSoldiers, dispatch, screen,
}: {
  gs: import('@/types/game').GameState;
  isNight: boolean;
  hasCriticalEvents: boolean;
  unresolvedEvents: import('@/types/events').GameEvent[];
  availableSoldiers: import('@/types/soldier').Soldier[];
  activeSoldiers: import('@/types/soldier').Soldier[];
  dispatch: React.Dispatch<import('@/contexts/GameContext').GameAction>;
  screen: string;
}) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex items-center justify-between p-3 pointer-events-auto">
        <div className="flex items-center gap-2 flex-wrap">
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
  );
}

function SideNav({
  screen, unresolvedEvents, dispatch,
}: {
  screen: string;
  unresolvedEvents: import('@/types/events').GameEvent[];
  dispatch: React.Dispatch<import('@/contexts/GameContext').GameAction>;
}) {
  const items = [
    { screen: 'map' as const, icon: MapIcon, label: 'Mapa' },
    { screen: 'soldiers' as const, icon: UserCheck, label: 'Soldados' },
    { screen: 'base' as const, icon: Building2, label: 'Base' },
    { screen: 'market' as const, icon: ShoppingCart, label: 'Mercado' },
  ];

  return (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 p-2">
      {items.map(({ screen: s, icon: Icon, label }) => (
        <TooltipProvider key={s}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={screen === s ? 'default' : 'secondary'}
                size="icon"
                className="w-10 h-10 bg-card/90 backdrop-blur border border-border"
                onClick={() => dispatch({ type: 'NAVIGATE', screen: s })}
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
