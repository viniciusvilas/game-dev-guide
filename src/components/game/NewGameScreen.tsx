// Iron Contract — New Game Screen (4-step flow)

import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { generateWorld } from '@/lib/generators/worldGenerator';
import TerrainCanvas from '@/components/map/TerrainCanvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Shield, MapPin } from 'lucide-react';
import type { Difficulty } from '@/types/company';
import type { Country, Region, City } from '@/types/world';

type Step = 1 | 2 | 3 | 4;

const DIFFICULTY_INFO: Record<Difficulty, { label: string; desc: string; funds: string; soldiers: string; color: string }> = {
  easy: { label: 'Fácil', desc: 'Mais recursos iniciais e facções menos agressivas', funds: '$80.000', soldiers: '8 soldados', color: 'hsl(142, 50%, 36%)' },
  normal: { label: 'Normal', desc: 'Experiência balanceada para jogadores experientes', funds: '$50.000', soldiers: '6 soldados', color: 'hsl(38, 92%, 50%)' },
  hard: { label: 'Difícil', desc: 'Recursos escassos e facções implacáveis', funds: '$30.000', soldiers: '4 soldados', color: 'hsl(0, 72%, 51%)' },
};

const POI_ICONS: Record<string, string> = {
  private_company: '🏭', government_area: '🏛️', airport: '✈️',
  conflict_zone: '⚔️', private_base: '🏕️', national_military_base: '🎖️',
  vip_residence: '🏠', terrorist_base: '💀', transport_hub: '🚛',
};

export default function NewGameScreen() {
  const { dispatch } = useGame();
  const [step, setStep] = useState<Step>(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [previewSeed] = useState(() => Math.floor(Math.random() * 2147483647));
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Preview world for map selection
  const preview = useMemo(() => {
    const worldSeed = { value: previewSeed, timestamp: 0 };
    const { world, terrainMap } = generateWorld(worldSeed);
    return { world, terrainMap };
  }, [previewSeed]);

  const handleConfirm = () => {
    if (!selectedCity) return;
    dispatch({
      type: 'NEW_GAME',
      seed: previewSeed,
      difficulty,
      startCityId: selectedCity.id,
    });
  };

  return (
    <div className="min-h-screen bg-sidebar-background text-sidebar-foreground flex flex-col">
      {/* Header */}
      <div className="text-center py-6 border-b border-sidebar-border">
        <h1 className="text-4xl font-bold tracking-tighter font-mono text-primary">IRON CONTRACT</h1>
        <p className="text-sm text-muted-foreground tracking-widest uppercase mt-1">Private Military Company Simulator</p>
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`w-8 h-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {/* STEP 1 — Difficulty */}
        {step === 1 && (
          <div className="space-y-6 w-full max-w-2xl">
            <h2 className="text-xl font-mono font-bold text-center">SELECIONE A DIFICULDADE</h2>
            <div className="grid grid-cols-3 gap-4">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map(d => {
                const info = DIFFICULTY_INFO[d];
                const selected = difficulty === d;
                return (
                  <Card
                    key={d}
                    className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${selected ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    <CardContent className="p-5 text-center space-y-3">
                      <div className="w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: info.color }} />
                      <h3 className="font-mono font-bold text-lg">{info.label}</h3>
                      <p className="text-xs text-muted-foreground">{info.desc}</p>
                      <div className="space-y-1 text-xs font-mono">
                        <div>{info.funds}</div>
                        <div>{info.soldiers}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-center">
              <Button className="font-mono gap-2" onClick={() => setStep(2)}>
                CONTINUAR <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 — Country */}
        {step === 2 && (
          <div className="space-y-4 w-full max-w-4xl">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <h2 className="text-xl font-mono font-bold">ESCOLHA SEU PAÍS</h2>
            </div>
            <p className="text-sm text-muted-foreground">Clique em um país no mapa para estabelecer sua base de operações</p>
            
            <div className="relative border border-border rounded-lg overflow-hidden" style={{ height: 350 }}>
              <TerrainCanvas terrainMap={preview.terrainMap} />
              {/* Country overlay clickable areas */}
              <svg viewBox="0 0 1000 700" className="absolute inset-0 w-full h-full">
                {preview.world.countries.map((country, idx) => {
                  const isHovered = selectedCountry?.id === country.id;
                  // Approximate bounds from country cities
                  const cities = country.regions.flatMap(r => r.cities);
                  const xs = cities.map(c => c.mapPosition.x);
                  const ys = cities.map(c => c.mapPosition.y);
                  const minX = Math.min(...xs) - 60;
                  const maxX = Math.max(...xs) + 60;
                  const minY = Math.min(...ys) - 60;
                  const maxY = Math.max(...ys) + 60;
                  
                  return (
                    <g key={country.id}>
                      <rect
                        x={minX} y={minY}
                        width={maxX - minX} height={maxY - minY}
                        fill={isHovered ? 'rgba(218, 165, 32, 0.15)' : 'transparent'}
                        stroke={isHovered ? 'hsl(38, 92%, 50%)' : 'rgba(255,255,255,0.2)'}
                        strokeWidth={isHovered ? 3 : 1}
                        rx={8}
                        className="cursor-pointer"
                        style={{ pointerEvents: 'all' }}
                        onClick={() => {
                          setSelectedCountry(country);
                          setSelectedRegion(null);
                          setSelectedCity(null);
                          setStep(3);
                        }}
                        onMouseEnter={() => setSelectedCountry(country)}
                        onMouseLeave={() => setSelectedCountry(null)}
                      />
                      <text
                        x={(minX + maxX) / 2} y={(minY + maxY) / 2}
                        textAnchor="middle"
                        fill={isHovered ? 'hsl(38, 92%, 65%)' : 'rgba(255,255,255,0.5)'}
                        fontSize={18}
                        fontFamily="'JetBrains Mono', monospace"
                        fontWeight={700}
                        letterSpacing={3}
                        className="pointer-events-none"
                      >
                        {country.name.toUpperCase()}
                      </text>
                      {/* City dots */}
                      {cities.map(city => (
                        <circle
                          key={city.id}
                          cx={city.mapPosition.x} cy={city.mapPosition.y}
                          r={4}
                          fill="rgba(255,255,255,0.6)"
                          className="pointer-events-none"
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* STEP 3 — Region */}
        {step === 3 && selectedCountry && (
          <div className="space-y-4 w-full max-w-4xl">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setStep(2); setSelectedCountry(null); }} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <h2 className="text-xl font-mono font-bold">ESCOLHA A REGIÃO — {selectedCountry.name.toUpperCase()}</h2>
            </div>
            
            <div className="flex gap-4">
              {/* Zoomed map */}
              <div className="relative border border-border rounded-lg overflow-hidden flex-1" style={{ height: 350 }}>
                <div style={{
                  transform: `scale(2.5)`,
                  transformOrigin: `${selectedCountry.mapBounds.x + selectedCountry.mapBounds.width / 2}px ${selectedCountry.mapBounds.y + selectedCountry.mapBounds.height / 2}px`,
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                }}>
                  <TerrainCanvas terrainMap={preview.terrainMap} />
                  <svg viewBox="0 0 1000 700" className="absolute inset-0 w-full h-full">
                    {selectedCountry.regions.map(region => {
                      const isSelected = selectedRegion?.id === region.id;
                      return (
                        <g key={region.id}>
                          <rect
                            x={region.mapBounds.x} y={region.mapBounds.y}
                            width={region.mapBounds.width} height={region.mapBounds.height}
                            fill={isSelected ? 'rgba(218, 165, 32, 0.15)' : 'transparent'}
                            stroke={isSelected ? 'hsl(38, 92%, 50%)' : 'rgba(255,255,255,0.3)'}
                            strokeWidth={isSelected ? 2 : 1}
                            strokeDasharray={isSelected ? 'none' : '6 4'}
                            className="cursor-pointer"
                            style={{ pointerEvents: 'all' }}
                            onClick={() => {
                              setSelectedRegion(region);
                              setSelectedCity(null);
                            }}
                          />
                          <text
                            x={region.mapBounds.x + region.mapBounds.width / 2}
                            y={region.mapBounds.y + region.mapBounds.height / 2}
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.6)"
                            fontSize={8}
                            fontFamily="'Inter', sans-serif"
                            className="pointer-events-none"
                          >
                            {region.name}
                          </text>
                          {region.cities.map(city => (
                            <circle
                              key={city.id}
                              cx={city.mapPosition.x} cy={city.mapPosition.y}
                              r={3}
                              fill="rgba(255,255,255,0.7)"
                              className="pointer-events-none"
                            />
                          ))}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Region list */}
              <div className="w-64 space-y-2">
                <h3 className="text-sm font-mono text-muted-foreground uppercase">Regiões</h3>
                {selectedCountry.regions.map(region => (
                  <Card
                    key={region.id}
                    className={`cursor-pointer transition-all hover:ring-1 hover:ring-primary/50 ${selectedRegion?.id === region.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => { setSelectedRegion(region); setSelectedCity(null); }}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium text-sm">{region.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {region.cities.length} cidades
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {selectedRegion && (
                  <Button className="w-full font-mono gap-2 mt-4" onClick={() => setStep(4)}>
                    CONTINUAR <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — City */}
        {step === 4 && selectedRegion && (
          <div className="space-y-4 w-full max-w-2xl">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
              <h2 className="text-xl font-mono font-bold">ESCOLHA A CIDADE INICIAL</h2>
            </div>
            <p className="text-sm text-muted-foreground">Sua base de operações será instalada na cidade selecionada</p>

            <div className="space-y-3">
              {selectedRegion.cities.map(city => {
                const isSelected = selectedCity?.id === city.id;
                return (
                  <Card
                    key={city.id}
                    className={`cursor-pointer transition-all hover:ring-1 hover:ring-primary/50 ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                    onClick={() => setSelectedCity(city)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="text-2xl">{POI_ICONS[city.poiType] || '📍'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{city.name}</span>
                          <Badge variant="outline" className="text-[10px] capitalize">{city.size}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Pop: {city.population.toLocaleString()} • Estabilidade: {city.stability}%
                        </div>
                      </div>
                      {isSelected && <Shield className="w-5 h-5 text-primary" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedCity && (
              <div className="pt-4 border-t border-border">
                <div className="text-center space-y-2 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Base: <span className="text-foreground font-mono font-bold">{selectedCity.name}</span>
                    {' — '}{selectedRegion.name}, {selectedCountry?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dificuldade: <span className="font-mono">{DIFFICULTY_INFO[difficulty].label}</span>
                    {' • '}{DIFFICULTY_INFO[difficulty].funds}
                    {' • '}{DIFFICULTY_INFO[difficulty].soldiers}
                  </p>
                </div>
                <Button className="w-full h-12 text-lg font-mono tracking-wider" onClick={handleConfirm}>
                  <Shield className="w-5 h-5 mr-2" />
                  INICIAR OPERAÇÕES
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-center py-3 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground font-mono">v0.9 — Todas as decisões são permanentes</p>
      </div>
    </div>
  );
}
