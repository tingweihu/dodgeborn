import type { CharacterId, Difficulty, SpecialId } from '../../shared/src/index.ts';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  hp: number;
  speed: number;
  throw: number;
  catch: number;
  special: SpecialId;
  color: number;
  accent: number;
}

export interface SpecialDef {
  id: SpecialId;
  name: string;
  description: string;
  damage: number;
  speed: number;
  knockback: number;
  color: number;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  KAI: { id: 'KAI', name: 'KAI', title: '平衡突擊', hp: 100, speed: 80, throw: 80, catch: 80, special: 'flame', color: 0xe76f51, accent: 0xf4ce74 },
  REX: { id: 'REX', name: 'REX', title: '重砲射手', hp: 115, speed: 62, throw: 98, catch: 60, special: 'gravity', color: 0xd65748, accent: 0xf4ce74 },
  MIO: { id: 'MIO', name: 'MIO', title: '疾風跑者', hp: 85, speed: 100, throw: 67, catch: 84, special: 'wind', color: 0x42b8c6, accent: 0xf1e7d8 },
  NOVA: { id: 'NOVA', name: 'NOVA', title: '精準守護', hp: 90, speed: 88, throw: 75, catch: 96, special: 'lightning', color: 0x7f9ee0, accent: 0xf4ce74 },
  BRUTUS: { id: 'BRUTUS', name: 'BRUTUS', title: '鋼壁前鋒', hp: 125, speed: 55, throw: 85, catch: 70, special: 'meteor', color: 0xa88f78, accent: 0xe76f51 },
  LUX: { id: 'LUX', name: 'LUX', title: '幻影變化', hp: 90, speed: 92, throw: 86, catch: 75, special: 'phantom', color: 0xd39fe3, accent: 0x42b8c6 }
};

export const CHARACTER_ORDER: CharacterId[] = ['KAI', 'REX', 'MIO', 'NOVA', 'BRUTUS', 'LUX'];

export const SPECIALS: Record<SpecialId, SpecialDef> = {
  flame: { id: 'flame', name: '烈焰貫穿', description: '高速直線 · 強力擊退', damage: 22, speed: 8.4, knockback: 12, color: 0xff8854 },
  lightning: { id: 'lightning', name: '雷電折射', description: '飛行途中轉向追擊', damage: 18, speed: 7.8, knockback: 7, color: 0xf4ce74 },
  wind: { id: 'wind', name: '殘影疾風', description: '蛇行飛行 · 快速突襲', damage: 17, speed: 8.0, knockback: 6, color: 0x6ce4d4 },
  phantom: { id: 'phantom', name: '幻影分身', description: '真球混入兩顆幻影', damage: 18, speed: 7.1, knockback: 6, color: 0xd9afe9 },
  gravity: { id: 'gravity', name: '重力爆震', description: '落點爆震 · 強力擊飛', damage: 23, speed: 6.4, knockback: 16, color: 0xe76f51 },
  meteor: { id: 'meteor', name: '流星彈幕', description: '三顆實球交錯進攻', damage: 16, speed: 7.5, knockback: 7, color: 0xf4ce74 }
};

export const COURT = {
  width: 480,
  height: 270,
  top: 62,
  bottom: 224,
  leftInner: { minX: 66, maxX: 224 },
  rightInner: { minX: 256, maxX: 414 },
  leftOuter: { minX: 423, maxX: 462 },
  rightOuter: { minX: 18, maxX: 57 },
  durationTicks: 180 * 60
} as const;

export const AI_SETTINGS: Record<Difficulty, { reaction: number; catchChance: number; dodgeChance: number; accuracy: number; attackDelay: number }> = {
  easy: { reaction: 14, catchChance: 0.35, dodgeChance: 0.45, accuracy: 19, attackDelay: 82 },
  normal: { reaction: 8, catchChance: 0.6, dodgeChance: 0.6, accuracy: 9, attackDelay: 70 },
  hard: { reaction: 5, catchChance: 0.7, dodgeChance: 0.72, accuracy: 3, attackDelay: 43 }
};
