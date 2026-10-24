import { CHARACTERS } from '../../../packages/content/src/index.ts';
import type { CharacterId, PlayerState, Team } from '../../../packages/shared/src/index.ts';

export const C = {
  night: '#182334', deep: '#111b2a', deep2: '#202f44', wood: '#c8a47c',
  coral: '#e76f51', cyan: '#42b8c6', gold: '#f4ce74', cream: '#f1e7d8',
  ink: '#273044', muted: '#94a9b3', paleWood: '#dbb58b', darkWood: '#ae865f'
};

export function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color = C.cream, align: CanvasTextAlign = 'left', weight = 700): void {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.font = `${weight} ${size}px "Microsoft JhengHei", "Noto Sans TC", "Trebuchet MS", sans-serif`;
  ctx.fillText(value, Math.round(x), Math.round(y));
}

export function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 1): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
  ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
  ctx.stroke();
}

export function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = C.deep2, edge = C.gold): void {
  rect(ctx, x + 2, y + 3, w, h, '#0b1320');
  rect(ctx, x, y, w, h, edge);
  rect(ctx, x + 2, y + 2, w - 4, h - 4, fill);
  rect(ctx, x + 5, y + 5, 5, 2, edge);
  rect(ctx, x + w - 10, y + h - 7, 5, 2, edge);
}

function pixel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  rect(ctx, x, y, w, h, color);
}

export function sprite(ctx: CanvasRenderingContext2D, character: CharacterId, team: Team, x: number, y: number, facing: number, state: PlayerState, tick: number, z = 0, scale = 1, hasBall = false): void {
  const def = CHARACTERS[character];
  const walk = state === 'run' || state === 'dash';
  const stride = walk && Math.floor(tick / (state === 'dash' ? 3 : 5)) % 2 === 0 ? 2 : 0;
  const down = state === 'out' || state === 'down';
  const idleBob = state === 'idle' && Math.floor(tick / 24) % 2 === 0 ? 1 : 0;
  const body = `#${def.color.toString(16).padStart(6, '0')}`;
  const accent = `#${def.accent.toString(16).padStart(6, '0')}`;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - z));
  ctx.scale(scale * (facing < 0 ? -1 : 1), scale);
  if (down) ctx.rotate(-Math.PI / 2);
  // A small, clean shadow anchors airborne characters without hiding court markings.
  ctx.fillStyle = '#28334455';
  ctx.beginPath();
  ctx.ellipse(0, 1 + z / Math.max(1, scale), 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const legLift = state === 'jump' ? 3 : 0;
  pixel(ctx, -6, -5 + stride - legLift, 5, 4, C.ink);
  pixel(ctx, 2, -5 - stride - legLift, 5, 4, C.ink);
  if (state === 'dash' || state === 'dodge') {
    pixel(ctx, -15, -9, 6, 2, team === 0 ? C.coral : C.cyan);
    pixel(ctx, -18, -15, 7, 2, C.cream);
  }
  const broad = character === 'REX' || character === 'BRUTUS';
  pixel(ctx, broad ? -9 : -7, -14, broad ? 18 : 14, 11, body);
  pixel(ctx, broad ? -7 : -5, -13, broad ? 14 : 10, 2, accent);
  pixel(ctx, -10, state === 'catch' ? -22 : -13, 3, state === 'throw' ? 2 : 6, '#efb78e');
  pixel(ctx, state === 'throw' ? 11 : 8, state === 'throw' || state === 'catch' ? -20 : -13, 3, 6, '#efb78e');
  if (character === 'REX') { pixel(ctx, -10, -15, 4, 5, C.ink); pixel(ctx, 7, -15, 4, 5, C.ink); }
  if (character === 'BRUTUS') { pixel(ctx, -11, -16, 5, 5, C.gold); pixel(ctx, 6, -16, 5, 5, C.gold); }
  if (character === 'MIO') { pixel(ctx, -5, -4, 4, 3, C.cyan); pixel(ctx, 2, -4, 4, 3, C.cyan); }
  if (character === 'LUX') { pixel(ctx, -10, -11, 5, 3, C.cyan); pixel(ctx, -13, -8 + stride, 5, 2, C.cyan); }
  pixel(ctx, -8, -27 - idleBob, 16, 13, '#f4c39e');
  pixel(ctx, -7, -28 - idleBob, 14, 3, '#f7d0ac');
  const hair = character === 'MIO' ? '#31475e' : character === 'LUX' ? '#e7d7f0' : character === 'NOVA' ? '#cad7ed' : character === 'BRUTUS' ? '#5a4840' : '#382f39';
  pixel(ctx, -8, -29, 16, 5, hair);
  if (character === 'KAI') { pixel(ctx, -5, -33, 5, 5, hair); pixel(ctx, 2, -31, 5, 3, hair); }
  if (character === 'REX') { pixel(ctx, -2, -34, 8, 6, hair); pixel(ctx, 5, -29, 3, 5, hair); pixel(ctx, -9, -28, 4, 4, hair); }
  if (character === 'MIO') { pixel(ctx, -9, -25, 4, 10, hair); pixel(ctx, 6, -26, 3, 10, hair); pixel(ctx, -13, -27 + stride, 5, 7, hair); }
  if (character === 'NOVA') { pixel(ctx, -8, -24, 16, 3, '#fff3bb'); pixel(ctx, -7, -23, 14, 2, '#688fc3'); }
  if (character === 'BRUTUS') { pixel(ctx, -9, -31, 18, 4, hair); pixel(ctx, -8, -26, 4, 5, hair); }
  if (character === 'LUX') { pixel(ctx, -9, -30, 10, 4, hair); pixel(ctx, 4, -28, 5, 9, hair); }
  if (character === 'KAI') pixel(ctx, -2, -10, 4, 3, C.gold);
  if (character === 'NOVA') pixel(ctx, -4, -11, 8, 3, C.gold);
  pixel(ctx, 1, -22, 2, 2, C.ink);
  pixel(ctx, 6, -22, 2, 2, C.ink);
  if (state === 'hit') pixel(ctx, 1, -21, 6, 2, C.ink);
  if (state === 'catch') {
    pixel(ctx, -13, -25, 3, 3, C.gold);
    pixel(ctx, 11, -26, 3, 3, C.gold);
  }
  if (team === 1) pixel(ctx, -7, -10, 14, 3, C.cyan);
  if (hasBall) {
    pixel(ctx, 9, -21, 8, 8, C.gold);
    pixel(ctx, 11, -19, 4, 4, C.coral);
  }
  ctx.restore();
}

let cachedCourt: HTMLCanvasElement | null = null;

function drawCourtBase(ctx: CanvasRenderingContext2D): void {
  rect(ctx, 0, 0, 480, 270, C.night);
  rect(ctx, 0, 49, 480, 185, '#81654e');
  rect(ctx, 9, 57, 462, 171, C.wood);
  for (let y = 57; y < 228; y += 13) {
    rect(ctx, 9, y, 462, 1, '#e4bf92');
    rect(ctx, 9, y + 6, 462, 1, '#b99068');
    const offset = ((y / 13) % 3) * 31;
    for (let x = 22 + offset; x < 465; x += 87) rect(ctx, x, y + 1, 1, 11, '#b28a64');
  }
  rect(ctx, 9, 57, 49, 171, '#6a8590aa');
  rect(ctx, 422, 57, 49, 171, '#a7735caa');
  for (let y = 65; y < 223; y += 12) {
    rect(ctx, 19, y, 30, 2, '#96acb055');
    rect(ctx, 431, y, 30, 2, '#d9a98b55');
  }
  ctx.strokeStyle = C.cream;
  ctx.lineWidth = 2;
  ctx.strokeRect(58.5, 61.5, 363, 162);
  line(ctx, 240, 62, 240, 224, '#f9e9cc', 3);
  line(ctx, 226, 62, 226, 224, '#8f6e54', 1);
  line(ctx, 254, 62, 254, 224, '#8f6e54', 1);
  ctx.beginPath(); ctx.arc(240, 143, 22, 0, Math.PI * 2); ctx.strokeStyle = '#f1e7d8a0'; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.arc(240, 143, 4, 0, Math.PI * 2); ctx.fillStyle = C.cream; ctx.fill();
  for (const x of [91, 389]) {
    ctx.beginPath(); ctx.arc(x, 143, 42, -Math.PI / 2, Math.PI / 2); ctx.strokeStyle = '#f1e7d866'; ctx.lineWidth = 1; ctx.stroke();
  }
  rect(ctx, 57, 57, 2, 171, '#344b58');
  rect(ctx, 421, 57, 2, 171, '#694d45');
  rect(ctx, 9, 57, 462, 2, '#f0c997');
  rect(ctx, 0, 229, 480, 3, C.ink);
}

export function court(ctx: CanvasRenderingContext2D, tick: number): void {
  if (!cachedCourt) {
    cachedCourt = document.createElement('canvas');
    cachedCourt.width = 480;
    cachedCourt.height = 270;
    const cacheContext = cachedCourt.getContext('2d');
    if (!cacheContext) throw new Error('Court canvas unavailable');
    drawCourtBase(cacheContext);
  }
  ctx.drawImage(cachedCourt, 0, 0);
  for (let i = 0; i < 7; i++) {
    const x = (i * 73 + 17 + Math.floor(tick / 6)) % 480;
    rect(ctx, x, 53, 3, 1, '#e8cb9b88');
  }
}
