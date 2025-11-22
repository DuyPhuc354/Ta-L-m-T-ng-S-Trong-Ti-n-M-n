
export enum Role {
  COMBAT_MAIN = 'COMBAT_MAIN',
  DPS = 'DPS',
  TANK = 'TANK',
  HEALER = 'HEALER',
  CROWD_CONTROL = 'CROWD_CONTROL',
  EXPLORER_CAPTAIN = 'EXPLORER_CAPTAIN',
  MASTER_CRAFTSMAN = 'MASTER_CRAFTSMAN',
  FODDER = 'FODDER',
  SPECIAL_CASE = 'SPECIAL_CASE',
}

export enum ElementType {
  METAL = 'Kim',
  WOOD = 'Mộc',
  WATER = 'Thủy',
  FIRE = 'Hỏa',
  EARTH = 'Thổ',
  MIXED = 'Tạp',
}

export interface DiscipleStats {
  potential: number;
  aptitude: number;
  bone: number;
  intelligence: number;
  charm: number;
  luck: number;
}

export interface Trait {
  name: string;
  isPositive: boolean;
  description: string;
  tier: 'S' | 'A' | 'B' | 'C' | 'F';
}

export interface Skill {
  name: string;
  level: number;
}

export type Verdict = 'RECRUIT' | 'KEEP_WORKER' | 'EXPEL_CANDIDATE' | 'REJECT';

export interface Disciple {
  id: string;
  imageHash?: string;
  name: string;
  originClass: string;
  stats: DiscipleStats;
  traits: Trait[];
  skills: Skill[];
  primaryElement: ElementType;
  verdict: Verdict;
  role: Role;
  analysis: string; // Short reason
  score: number;
}

export interface AnalysisResult {
  disciple: Disciple;
  rawResponse: string;
}
