// Iron Contract — Map Screen (3-level semantic zoom + terrain canvas)

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import type { City, Country, Region } from '@/types/world';
import type { Faction } from '@/types/faction';
import { getFactionColor } from '@/lib/utils/factionColors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TerrainCanvas from '@/components/map/TerrainCanvas';
import CityDrawer from './CityDrawer';
import {
  Play, DollarSign, Calendar, AlertTriangle, Sun, Moon, Users, Save,
  Map as MapIcon, UserCheck, Building2, ShoppingCart, ChevronRight, ArrowLeft,
} from 'lucide-react';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 700;

type ZoomLevel = 1 | 2 | 3;

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

function computeViewport(level: ZoomLevel, country?: Country, region?: Region): Viewport {
  if (level === 3 && region) {
    const cx = region.mapBounds.x + region.mapBounds.width / 2;
    const cy = region.mapBounds.y + region.mapBounds.height / 2;
    return { x: cx, y: cy, scale: 5 };
  }
  if (level === 2 && country) {
    const cx = country.mapBounds.x + country.mapBounds.width / 2;
    const cy = country.mapBounds.y + country.mapBounds.height / 2;
    return { x: cx, y: cy, scale: 2.5 };
  }
  return { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2, scale: 1 };
}

export default function MapScreen() {
  const { state, dispatch } = useGame();
  const gs = state.gameState!;
  
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  // Free zoom/pan within level
  const [freeZoom, setFreeZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const isNight = gs.world.timeOfDay === 'night';
  const criticalEvents = gs.events.filter(e => !e.resolved && e.priority === 'critical');
  const unresolvedEvents = gs.events.filter(e => !e.resolved);
  const hasCriticalEvents = criticalEvents.length > 0;
  const activeSoldiers = gs.soldiers.filter(s => s.status !== 'dead' && s.status !== 'deserted');
  const availableSoldiers = gs.soldiers.filter(s => s.status === 'available');

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

  const contractsByCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of gs.availableContracts) {
      map.set(c.targetCityId, (map.get(c.targetCityId) || 0) + 1);
    }
    return map;
  }, [gs.availableContracts]);

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

  const viewport = useMemo(
    () => computeViewport(zoomLevel, selectedCountry ?? undefined, selectedRegion ?? undefined),
    [zoomLevel, selectedCountry, selectedRegion],
  );

  // Reset free zoom/pan on level change
  useEffect(() => {
    setFreeZoom(1);
    setPan({ x: 0, y: 0 });
  }, [zoomLevel, selectedCountry, selectedRegion]);

  const navigateToCountry = (country: Country) => {
    setSelectedCountry(country);
    setSelectedRegion(null);
    setZoomLevel(2);
  };

  const navigateToRegion = (region: Region) => {
    setSelectedRegion(region);
    setZoomLevel(3);
  };

  const navigateBack = () => {
    if (zoomLevel === 3) {
      setSelectedRegion(null);
      setZoomLevel(2);
    } else if (zoomLevel === 2) {
      setSelectedCountry(null);
      setZoomLevel(1);
    }
  };

  // Zoom handler (free zoom within level)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setFreeZoom(z => Math.max(0.5, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

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

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    const up = () => setIsPanning(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const totalScale = viewport.scale * freeZoom;

  // Determine which cities are visible at current zoom level
  const visibleCities = useMemo(() => {
    if (zoomLevel === 3 && selectedRegion) {
      return allCities.filter(c => selectedRegion.cities.some(rc => rc.id === c.id));
    }
    if (zoomLevel === 2 && selectedCountry) {
      return allCities.filter(c => 
        selectedCountry.regions.some(r => r.cities.some(rc => rc.id === c.id))
      );
    }
    return allCities;
  }, [zoomLevel, selectedCountry, selectedRegion, allCities]);

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {/* HUD Overlay */}
      <HudOverlay
        gs={gs} isNight={isNight} hasCriticalEvents={hasCriticalEvents}
        unresolvedEvents={unresolvedEvents} availableSoldiers={availableSoldiers}
        activeSoldiers={activeSoldiers} dispatch={dispatch}
      />

      {/* Side Navigation */}
      <SideNav screen={state.screen} unresolvedEvents={unresolvedEvents} dispatch={dispatch} />

      {/* Breadcrumb */}
      {zoomLevel > 1 && (
        <div className="absolute top-14 left-16 z-20 flex items-center gap-1 text-sm font-mono">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs bg-card/90 backdrop-blur" onClick={() => { setSelectedCountry(null); setSelectedRegion(null); setZoomLevel(1); }}>
            Mundo
          </Button>
          {selectedCountry && (
            <>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <Button
                variant="ghost" size="sm"
                className={`h-7 px-2 text-xs bg-card/90 backdrop-blur ${zoomLevel === 2 ? 'text-primary' : ''}`}
                onClick={() => { setSelectedRegion(null); setZoomLevel(2); }}
              >
                {selectedCountry.name}
              </Button>
            </>
          )}
          {selectedRegion && (
            <>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs font-mono bg-card/90 backdrop-blur">
                {selectedRegion.name}
              </Badge>
            </>
          )}
          <Button variant="ghost" size="icon" className="w-7 h-7 bg-card/90 backdrop-blur ml-1" onClick={navigateBack}>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Map Container */}
      <div
        className="flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          className="transition-transform duration-400 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${totalScale})`,
            transformOrigin: `${viewport.x}px ${viewport.y}px`,
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          <TerrainCanvas terrainMap={gs.terrainMap} nightMode={isNight} />

          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            {/* LEVEL 1 — Country names + overlays */}
            {zoomLevel === 1 && gs.world.countries.map(country => {
              const cities = country.regions.flatMap(r => r.cities);
              const xs = cities.map(c => c.mapPosition.x);
              const ys = cities.map(c => c.mapPosition.y);
              const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
              const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

              return (
                <g key={country.id}>
                  <rect
                    x={country.mapBounds.x} y={country.mapBounds.y}
                    width={country.mapBounds.width} height={country.mapBounds.height}
                    fill={country.color} fillOpacity={0.08}
                    stroke="rgba(255,255,255,0.3)" strokeWidth={2}
                    className="cursor-pointer"
                    style={{ pointerEvents: 'all' }}
                    onClick={() => navigateToCountry(country)}
                  />
                  <text
                    x={cx} y={cy}
                    textAnchor="middle" dominantBaseline="central"
                    fill="rgba(255,255,255,0.4)"
                    fontSize={24} fontFamily="'JetBrains Mono', monospace"
                    fontWeight={700} letterSpacing={6}
                    className="pointer-events-none"
                  >
                    {country.name.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* LEVEL 2 — Region divisions */}
            {zoomLevel === 2 && selectedCountry && selectedCountry.regions.map(region => (
              <g key={region.id}>
                <rect
                  x={region.mapBounds.x} y={region.mapBounds.y}
                  width={region.mapBounds.width} height={region.mapBounds.height}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="8 5"
                  className="cursor-pointer"
                  style={{ pointerEvents: 'all' }}
                  onClick={() => navigateToRegion(region)}
                />
                <text
                  x={region.mapBounds.x + region.mapBounds.width / 2}
                  y={region.mapBounds.y + 14}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)" fontSize={10}
                  fontFamily="'Inter', sans-serif"
                  className="pointer-events-none"
                >
                  {region.name}
                </text>
              </g>
            ))}

            {/* Faction territory circles (levels 2-3) */}
            {zoomLevel >= 2 && visibleCities.map(city => {
              const faction = cityFactionMap.get(city.id);
              if (!faction) return null;
              const color = getFactionColor(faction.id);
              const radius = Math.max(20, Math.min(60, faction.militaryPower * 0.6));
              const opacity = (faction.militaryPower / 100) * 0.4;
              const isPulsing = faction.militaryPower >= 80;
              return (
                <circle
                  key={`faction-${city.id}`}
                  cx={city.mapPosition.x} cy={city.mapPosition.y}
                  r={radius} fill={color} fillOpacity={opacity}
                  className={isPulsing ? 'animate-faction-pulse' : ''}
                />
              );
            })}

            {/* Cities */}
            {(zoomLevel >= 2 ? visibleCities : allCities).map(city => {
              const isBase = city.id === gs.base.cityId;
              const hasContracts = (contractsByCity.get(city.id) || 0) > 0;
              const faction = cityFactionMap.get(city.id);
              const factionColor = faction ? getFactionColor(faction.id) : undefined;
              const contractCount = contractsByCity.get(city.id) || 0;
              const showDetails = zoomLevel >= 2;

              return (
                <g
                  key={city.id}
                  className="cursor-pointer"
                  style={{ pointerEvents: 'all' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (zoomLevel === 1) return; // level 1 = click country, not city
                    if (zoomLevel === 2) {
                      // Find region for this city and zoom in
                      const region = selectedCountry?.regions.find(r => r.cities.some(c => c.id === city.id));
                      if (region) navigateToRegion(region);
                      return;
                    }
                    setSelectedCityId(city.id);
                  }}
                >
                  {/* Faction border ring */}
                  {showDetails && factionColor && (
                    <circle
                      cx={city.mapPosition.x} cy={city.mapPosition.y}
                      r={isBase ? 15 : 11}
                      fill="none" stroke={factionColor} strokeWidth={2} strokeOpacity={0.7}
                    />
                  )}

                  {isBase ? (
                    <>
                      <circle
                        cx={city.mapPosition.x} cy={city.mapPosition.y}
                        r={showDetails ? 12 : 6}
                        fill="hsl(38, 92%, 50%)" fillOpacity={0.9}
                        stroke="hsl(38, 92%, 65%)" strokeWidth={2}
                      />
                      {showDetails && (
                        <text
                          x={city.mapPosition.x} y={city.mapPosition.y + 4}
                          textAnchor="middle" fontSize={12} fill="white"
                        >
                          🛡
                        </text>
                      )}
                    </>
                  ) : (
                    <circle
                      cx={city.mapPosition.x} cy={city.mapPosition.y}
                      r={showDetails ? 8 : 4}
                      fill={hasContracts ? 'hsl(38, 92%, 50%)' : 'hsl(0, 0%, 85%)'}
                      fillOpacity={hasContracts ? 0.9 : 0.7}
                      stroke={hasContracts ? 'hsl(38, 92%, 65%)' : 'hsl(0, 0%, 95%)'}
                      strokeWidth={1.5}
                      className={hasContracts && showDetails ? 'animate-contract-pulse' : ''}
                    />
                  )}

                  {/* Contract count */}
                  {showDetails && hasContracts && !isBase && (
                    <text
                      x={city.mapPosition.x} y={city.mapPosition.y + 3.5}
                      textAnchor="middle" fontSize={9} fill="white"
                      fontFamily="'JetBrains Mono', monospace" fontWeight={700}
                    >
                      {contractCount}
                    </text>
                  )}

                  {/* City name (level 3 only) */}
                  {zoomLevel === 3 && (
                    <text
                      x={city.mapPosition.x} y={city.mapPosition.y + (isBase ? 24 : 20)}
                      textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={9}
                      fontFamily="'Inter', sans-serif" fontWeight={isBase ? 600 : 400}
                      stroke="rgba(0,0,0,0.5)" strokeWidth={0.3}
                    >
                      {city.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-xs bg-card/90 backdrop-blur border border-border">
          Nv.{zoomLevel} • {Math.round(totalScale * 100)}%
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
  gs, isNight, hasCriticalEvents, unresolvedEvents, availableSoldiers, activeSoldiers, dispatch,
}: {
  gs: import('@/types/game').GameState;
  isNight: boolean;
  hasCriticalEvents: boolean;
  unresolvedEvents: import('@/types/events').GameEvent[];
  availableSoldiers: import('@/types/soldier').Soldier[];
  activeSoldiers: import('@/types/soldier').Soldier[];
  dispatch: React.Dispatch<import('@/contexts/GameContext').GameAction>;
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
          <Badge variant="secondary" className="font-mono text-xs gap-1.5 py-1 px-2.5 bg-card/90 backdrop-blur border border-border">
            Nv.{gs.companyLevel}
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
                  <Button size="sm" className="font-mono text-xs gap-1.5"
                    onClick={() => dispatch({ type: 'ADVANCE_DAY' })}
                    disabled={hasCriticalEvents}
                  >
                    <Play className="w-3.5 h-3.5" /> AVANÇAR DIA
                  </Button>
                </span>
              </TooltipTrigger>
              {hasCriticalEvents && <TooltipContent>Resolva eventos críticos primeiro</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => dispatch({ type: 'SAVE_GAME' })}>
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
                variant="secondary" size="icon"
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
  events, onResolve,
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
          <span className="text-xs text-muted-foreground font-mono">{currentIndex + 1}/{events.length}</span>
          <Button size="sm" variant="destructive" className="font-mono"
            onClick={() => {
              onResolve(evt.id);
              if (currentIndex < events.length - 1) setCurrentIndex(currentIndex + 1);
            }}
          >
            CONFIRMAR
          </Button>
        </div>
      </div>
    </div>
  );
}
