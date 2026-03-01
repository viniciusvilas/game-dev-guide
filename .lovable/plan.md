

## Etapa 1 — Fundação de Dados: Interfaces TypeScript

Criar os 13 arquivos de tipos em `src/types/`, cobrindo todas as entidades do GDD.

### Arquivos:

1. **`src/types/world.ts`** — `WorldSeed`, `Country`, `Region`, `City`, `CitySize`, `POI`, `POIType`, `WorldData`

2. **`src/types/soldier.ts`** — `Soldier`, `SoldierStatus`, `Rank`, `SoldierAttributes`, `WeaponMastery`, `SoldierSkill`

3. **`src/types/equipment.ts`** — `Weapon`, `Armor`, `WeaponCategory`, `ArmorType`, `WeaponCondition`

4. **`src/types/faction.ts`** — `Faction`, `FactionType`, `FactionLeader`

5. **`src/types/character.ts`** — `CEO`, `GovernmentOfficial`

6. **`src/types/company.ts`** — `Company`, `Difficulty`

7. **`src/types/base.ts`** — `Base`, `BaseStructure`, `StructureType` (Alojamento, Armeiro, Centro Médico, Sala de Ops)

8. **`src/types/contract.ts`** — `Contract`, `ContractType`, `ActiveContract`, `ContractResult`, `MissionApproach`

9. **`src/types/combat.ts`** — Tipos do motor de combate: `CombatResult`, `CombatPhase`, `DamageState`, `DistanceCategory`, `ShelterLevel`, `IntelLevel` + os 3 tipos de entrada solicitados:
   - **`SoldierCombatInput`** — PS, DPS calculado, HP efetivo, stress, patente, arma e colete equipados
   - **`FactionCombatInput`** — efetivo, nível médio, mult_equip, stress base, M_abrigo
   - **`MissionCombatContext`** — distância, abrigo, intel (0-3), abordagem, hora do dia (diurno/noturno)

10. **`src/types/economy.ts`** — `FinanceRecord`, `DailyTransaction`, `TransactionType`

11. **`src/types/reputation.ts`** — `ReputationData` (profissional, notoriedade, por CEO, por país)

12. **`src/types/events.ts`** — `GameEvent`, `EventType`

13. **`src/types/game.ts`** — `GameState` (objeto master para save/load), barrel export `index.ts`

Todos os campos seguem exatamente o GDD. Funções puras e sem dependências externas.

