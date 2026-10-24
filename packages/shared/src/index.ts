export type Team = 0 | 1;
export type MatchMode = 'solo' | 'versus';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type CharacterId = 'KAI' | 'REX' | 'MIO' | 'NOVA' | 'BRUTUS' | 'LUX';
export type SpecialId = 'flame' | 'lightning' | 'wind' | 'phantom' | 'gravity' | 'meteor';
export type PlayerState = 'idle' | 'run' | 'dash' | 'jump' | 'throw' | 'catch' | 'dodge' | 'hit' | 'down' | 'out';

export interface InputFrame {
  x: number;
  y: number;
  dash?: boolean;
  jump?: boolean;
  throw?: boolean;
  pass?: boolean;
  catch?: boolean;
  dodge?: boolean;
}

export type GameEvent =
  | { kind: 'throw'; x: number; y: number; team: Team; special: SpecialId | null }
  | { kind: 'catch'; x: number; y: number; team: Team; perfect: boolean }
  | { kind: 'hit'; x: number; y: number; team: Team; damage: number; special: SpecialId | null }
  | { kind: 'out'; x: number; y: number; team: Team }
  | { kind: 'pickup'; x: number; y: number; team: Team }
  | { kind: 'win'; team: Team | null };
