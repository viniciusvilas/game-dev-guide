// Iron Contract — Base Types (GDD-faithful)

export type StructureType =
  | 'barracks'      // Alojamento
  | 'armory'        // Armeiro
  | 'medical_center' // Centro Médico
  | 'ops_room';     // Sala de Operações

export interface BaseStructure {
  type: StructureType;
  level: number;      // 1-5
  upgradeCost: number;
  capacity: number;   // depends on type: soldiers, weapons, patients, intel slots
}

export interface Base {
  id: string;
  name: string;
  cityId: string;
  structures: BaseStructure[];
  maxSoldiers: number;   // derived from barracks level
}
