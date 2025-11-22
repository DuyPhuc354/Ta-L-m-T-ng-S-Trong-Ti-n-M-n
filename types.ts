

export enum Role {
  COMBAT_MAIN = 'COMBAT_MAIN', // Chủ lực chiến đấu
  DPS = 'DPS', // Sát thương chủ lực
  TANK = 'TANK', // Chịu đòn
  HEALER = 'HEALER', // Hồi máu
  CROWD_CONTROL = 'CROWD_CONTROL', // Khống chế / Buff
  EXPLORER_CAPTAIN = 'EXPLORER_CAPTAIN', // Thám hiểm chính
  MASTER_CRAFTSMAN = 'MASTER_CRAFTSMAN', // Thợ chuyên nghiệp / Nòng cốt kinh tế
  FODDER = 'FODDER', // Phế vật / Trục xuất
  SPECIAL_CASE = 'SPECIAL_CASE', // Trường hợp đặc biệt (VD: Trư Bát Giới)
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
  potential: number; // Tiềm Lực
  aptitude: number;   // Tư Chất (thay cho Khí Cảm, quyết định tấn công và tốc độ tu luyện)
  bone: number;      // Căn Cốt
  intelligence: number; // Thông Tuệ
  charm: number;     // Mị Lực
  luck: number;      // Cơ Duyên
}

export interface Trait {
  name: string;
  isPositive: boolean;
  description: string;
  tier: 'S' | 'A' | 'B' | 'C' | 'F';
}

export interface Skill {
  name: string; // e.g., Luyện Đan, Luyện Khí, Kiếm Tu
  level: number;
}

export interface Disciple {
  id: string;
  imageHash?: string; // Unique hash of the source image to prevent duplicates
  name: string;
  originClass: string; // Xuất thân (e.g., Kiếm Tu, Binh Gia, Y Sư)
  stats: DiscipleStats;
  traits: Trait[];
  skills: Skill[];
  primaryElement: ElementType; // Highest element
  verdict: 'RECRUIT' | 'KEEP_WORKER' | 'REJECT';
  role: Role;
  analysis: string; // AI Reasoning
  score: number; // Calculated score for sorting
}

export interface AnalysisResult {
  disciple: Disciple;
  rawResponse: string;
}