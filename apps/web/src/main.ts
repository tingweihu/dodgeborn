import { Match } from '../../../packages/core/src/index.ts';
import { CHARACTER_ORDER, CHARACTERS, COURT, SPECIALS } from '../../../packages/content/src/index.ts';
import type { CharacterId, Difficulty, GameEvent, InputFrame, MatchMode, Team } from '../../../packages/shared/src/index.ts';
import { C, court, line, panel, rect, sprite, text } from './art.ts';
import { MusicEngine } from './music.ts';

type Screen = 'menu' | 'select' | 'howto' | 'match' | 'pause' | 'result';
interface Region { x: number; y: number; w: number; h: number; action: () => void }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('Game canvas missing');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Canvas 2D unavailable');
ctx.imageSmoothingEnabled = false;

let screen: Screen = 'menu';
let mode: MatchMode = 'solo';
let difficulty: Difficulty = 'normal';
let p1: CharacterId = 'KAI';
let p2: CharacterId = 'REX';
let selecting: Team = 0;
let menuIndex = 0;
let selectionIndex = 0;
let match: Match | null = null;
let effects: Particle[] = [];
let banner = '';
let bannerTicks = 0;
let specialsThrown = 0;
let shake = 0;
let frames = 0;
let lastTime = 0;
let lag = 0;
const STEP_MS = 1000 / 60;
const keys = new Set<string>();
const regions: Region[] = [];
const testMode = new URLSearchParams(location.search).has('test');
const music = new MusicEngine();
document.body.dataset.music = 'on';

function resize(): void {
  const scale = Math.min(innerWidth / COURT.width, innerHeight / COURT.height);
  const pixelScale = scale >= 1 ? Math.floor(scale) : scale;
  canvas!.style.width = `${Math.floor(COURT.width * pixelScale)}px`;
  canvas!.style.height = `${Math.floor(COURT.height * pixelScale)}px`;
}
addEventListener('resize', resize);
resize();

function setScreen(next: Screen): void {
  screen = next;
  document.body.dataset.screen = next;
  music.setScene(next);
  canvas!.focus();
}
setScreen('menu');

function button(x: number, y: number, w: number, h: number, label: string, active: boolean, action: () => void): void {
  panel(ctx!, x, y, w, h, active ? '#334759' : C.deep2, active ? C.gold : '#668091');
  if (active) rect(ctx!, x + 4, y + 6, 3, h - 12, C.coral);
  text(ctx!, label, x + 14, y + Math.floor((h - 15) / 2), 13, active ? C.cream : '#bacbd0');
  text(ctx!, '›', x + w - 15, y + Math.floor((h - 15) / 2) - 1, 15, active ? C.gold : '#668091');
  regions.push({ x, y, w, h, action });
}

function drawFrame(title: string, caption: string): void {
  court(ctx!, frames);
  rect(ctx!, 0, 0, 480, 270, '#101a29dc');
  rect(ctx!, 0, 0, 480, 4, C.coral);
  rect(ctx!, 0, 266, 480, 4, C.cyan);
  text(ctx!, title, 20, 14, 22, C.cream);
  text(ctx!, caption, 21, 43, 9, C.muted, 'left', 600);
}

function drawMenu(): void {
  court(ctx!, frames);
  rect(ctx!, 0, 0, 480, 270, '#101a29db');
  rect(ctx!, 0, 0, 480, 4, C.coral);
  rect(ctx!, 24, 25, 3, 89, C.gold);
  text(ctx!, 'ORIGINAL PIXEL ARCADE', 34, 22, 9, C.gold);
  text(ctx!, 'DODGEBORN', 31, 49, 39, C.cream, 'left', 900);
  text(ctx!, '躲出破綻，接住勝利。', 34, 96, 11, C.cyan);
  text(ctx!, '6 VS 6  •  INNER / OUTER COURT', 34, 113, 8, '#b8c8cf');
  rect(ctx!, 267, 54, 196, 161, '#35465778');
  line(ctx!, 272, 212, 463, 212, '#f4ce7488', 2);
  sprite(ctx!, 'MIO', 0, 302, 221, 1, 'dash', frames, 0, 2);
  sprite(ctx!, 'KAI', 0, 359, 222, 1, 'throw', frames, 0, 4, true);
  sprite(ctx!, 'REX', 1, 433, 223, -1, 'catch', frames, 0, 3);
  rect(ctx!, 312, 188, 6, 6, C.gold);
  rect(ctx!, 320, 183, 3, 3, C.coral);
  button(31, 141, 191, 31, '單人對 AI', menuIndex === 0, () => { mode = 'solo'; selecting = 0; setScreen('select'); });
  button(31, 181, 191, 31, '雙人同機對戰', menuIndex === 1, () => { mode = 'versus'; selecting = 0; setScreen('select'); });
  button(31, 221, 191, 31, '操作與規則', menuIndex === 2, () => setScreen('howto'));
  text(ctx!, '© 2026  DODGEBORN', 469, 249, 7, '#8398a2', 'right', 600);
}

function drawSelect(): void {
  drawFrame('選擇球員', mode === 'versus' ? `雙人對戰  /  ${selecting === 0 ? 'P1 選角' : 'P2 選角'}` : '單人對 AI  /  P1 選角');
  for (let i = 0; i < CHARACTER_ORDER.length; i++) {
    const id = CHARACTER_ORDER[i]!;
    const def = CHARACTERS[id];
    const x = 15 + i * 75;
    const selected = i === selectionIndex;
    panel(ctx!, x, 59, 70, 127, selected ? '#344658' : '#253548', selected ? C.gold : '#5c7180');
    rect(ctx!, x + 5, 65, 60, 72, selected ? '#6c6671' : '#405467');
    rect(ctx!, x + 6, 115, 58, 21, selected ? '#d6ad7b' : '#94a7a9');
    sprite(ctx!, id, selecting, x + 36, 124, 1, 'idle', frames, 0, 2);
    text(ctx!, id, x + 35, 139, 12, selected ? C.gold : C.cream, 'center');
    text(ctx!, `HP ${def.hp}`, x + 7, 155, 8, '#d5dfe0');
    text(ctx!, `SPD ${def.speed}`, x + 7, 168, 8, '#d5dfe0');
    regions.push({ x, y: 59, w: 70, h: 127, action: () => { selectionIndex = i; } });
  }
  const selected = CHARACTERS[CHARACTER_ORDER[selectionIndex]!];
  line(ctx!, 18, 191, 461, 191, '#667c89', 1);
  text(ctx!, `${selected.title}  ·  ${SPECIALS[selected.special].name}`, 18, 196, 10, C.gold);
  text(ctx!, `${SPECIALS[selected.special].description}  |  投 ${selected.throw}  接 ${selected.catch}`, 18, 211, 9, C.cream);
  if (mode === 'solo') {
    text(ctx!, 'AI', 18, 231, 9, C.muted);
    (['easy', 'normal', 'hard'] as Difficulty[]).forEach((level, i) => {
      const x = 42 + i * 71;
      rect(ctx!, x, 226, 65, 21, difficulty === level ? C.gold : '#6d8591');
      rect(ctx!, x + 2, 228, 61, 17, difficulty === level ? '#3b4d5b' : '#26374a');
      text(ctx!, level.toUpperCase(), x + 32, 232, 8, difficulty === level ? C.gold : C.cream, 'center');
      regions.push({ x, y: 226, w: 65, h: 21, action: () => { difficulty = level; } });
    });
  }
  button(341, 224, 123, 29, selecting === 0 && mode === 'versus' ? '確認 P1' : '開始比賽', true, confirmSelection);
  if (mode === 'versus') text(ctx!, '← / → 選擇    ENTER 確認    ESC 返回', 18, 249, 8, C.muted);
}

function drawHowto(): void {
  drawFrame('操作與規則', '高速攻防  /  接球瞬間可強化下一次反擊');
  panel(ctx!, 16, 65, 217, 150, '#243449', C.cyan);
  panel(ctx!, 247, 65, 217, 150, '#28394a', C.coral);
  text(ctx!, 'P1  /  EMBER', 28, 77, 13, C.coral);
  text(ctx!, 'P2  /  TIDE', 259, 77, 13, C.cyan);
  const left = ['WASD  移動', '左 Shift  衝刺', 'R  跳躍   F / 空白  投球', 'G  接球   Q  閃避', 'E  傳球'];
  const right = ['方向鍵  移動', '右 Shift  衝刺', 'I  跳躍   K / Enter  投球', 'L  接球   O  閃避', 'U  傳球'];
  left.forEach((item, i) => text(ctx!, item, 29, 102 + i * 20, 10, C.cream));
  right.forEach((item, i) => text(ctx!, item, 260, 102 + i * 20, 10, C.cream));
  rect(ctx!, 18, 221, 444, 28, '#405165');
  text(ctx!, '助跑 → 跳起 → 出手：啟動角色必殺球    ·    三名內野全滅即落敗', 26, 229, 10, C.gold);
  text(ctx!, 'ESC 返回 / 比賽中暫停 / M 背景音樂開關', 20, 254, 8, C.muted);
  regions.push({ x: 0, y: 0, w: 480, h: 270, action: () => setScreen('menu') });
}

function bar(x: number, y: number, w: number, fraction: number, color: string): void {
  rect(ctx!, x, y, w, 6, '#516273');
  rect(ctx!, x + 1, y + 1, Math.max(0, Math.round((w - 2) * fraction)), 4, color);
}

function drawHUD(game: Match): void {
  rect(ctx!, 0, 0, 480, 51, C.night);
  rect(ctx!, 0, 0, 480, 3, C.coral);
  rect(ctx!, 0, 48, 480, 3, '#122031');
  text(ctx!, 'EMBER', 16, 8, 13, C.coral);
  text(ctx!, 'TIDE', 465, 8, 13, C.cyan, 'right');
  const [control0, control1] = game.controlled;
  for (const team of [0, 1] as Team[]) {
    const inners = game.players.filter(p => p.team === team && p.lane === 'inner');
    inners.forEach((player, i) => {
      const x = team === 0 ? 16 + i * 45 : 331 + i * 45;
      const controlled = player.id === control0.id || player.id === control1?.id;
      text(ctx!, player.character.slice(0, 3), x, 27, 9, player.state === 'out' ? '#647889' : controlled ? C.gold : C.cream);
      bar(x, 39, 38, player.hp / player.maxHp, team === 0 ? C.coral : C.cyan);
      if (controlled) rect(ctx!, x, 46, 38, 1, C.gold);
    });
  }
  panel(ctx!, 195, 7, 90, 36, C.deep2, C.gold);
  const minutes = Math.floor(game.timeRemaining / 60);
  const seconds = (game.timeRemaining % 60).toString().padStart(2, '0');
  text(ctx!, `${minutes}:${seconds}`, 240, 13, 19, C.cream, 'center');
  rect(ctx!, 0, 232, 480, 38, C.night);
  rect(ctx!, 0, 232, 480, 2, '#d9b58c');
  rect(ctx!, 12, 239, 3, 24, C.coral);
  text(ctx!, game.mode === 'versus'
    ? 'P1  WASD 移動  F 投  G 接  Q 閃  E 傳     P2  方向鍵移動  K 投  L 接  O 閃  U 傳'
    : 'P1  WASD 移動   SHIFT 衝刺   R 跳躍   F 投球   G 接球', 21, 238, 9, C.cream);
  text(ctx!, game.mode === 'versus'
    ? 'SHIFT 衝刺  ·  R / I 跳躍  ·  助跑跳投 = 必殺球  ·  ESC 暫停'
    : 'Q 閃避   E 傳球   ·   助跑 + 跳起 + 出手 = 必殺球   ·   ESC 暫停', 21, 252, 9, C.gold);
}

function drawBall(game: Match): void {
  for (const ball of game.balls) {
    if (ball.mode === 'held') continue;
    const color = ball.special ? `#${SPECIALS[ball.special].color.toString(16).padStart(6, '0')}` : C.gold;
    ball.trail.forEach((point, i) => {
      const size = Math.max(1, 5 - i);
      rect(ctx!, point.x - size / 2, point.y - size / 2, size, size, i > 3 ? '#fff2d177' : `${color}bb`);
    });
    if (!ball.real) {
      rect(ctx!, ball.x - 5, ball.y - 5, 10, 10, '#dcaef188');
      rect(ctx!, ball.x - 2, ball.y - 2, 4, 4, C.deep2);
    } else {
      rect(ctx!, ball.x - 5, ball.y - 5, 10, 10, C.cream);
      rect(ctx!, ball.x - 4, ball.y - 4, 8, 8, color);
      rect(ctx!, ball.x - 2, ball.y - 2, 3, 3, '#fff5d4');
      if (ball.special === 'lightning') {
        line(ctx!, ball.x - 8, ball.y - 8, ball.x - 3, ball.y - 3, C.gold, 2);
        line(ctx!, ball.x + 5, ball.y + 5, ball.x + 10, ball.y + 9, C.gold, 2);
      }
      if (ball.special === 'gravity') {
        ctx!.beginPath(); ctx!.arc(ball.x, ball.y, 8 + Math.sin(frames / 3) * 2, 0, Math.PI * 2);
        ctx!.strokeStyle = C.coral; ctx!.lineWidth = 1; ctx!.stroke();
      }
    }
  }
}

function drawMatch(): void {
  if (!match) return;
  ctx!.save();
  if (shake > 0) ctx!.translate(Math.round((Math.random() - 0.5) * shake), Math.round((Math.random() - 0.5) * shake));
  court(ctx!, frames);
  const [control0, control1] = match.controlled;
  const ballOwners = new Set(match.balls.filter(ball => ball.mode === 'held').map(ball => ball.ownerId));
  const players = [...match.players].sort((a, b) => a.y - b.y);
  for (const player of players) {
    if (player.state === 'out') {
      ctx!.globalAlpha = 0.4;
      sprite(ctx!, player.character, player.team, player.x, player.y, player.facing, 'down', match.tick);
      ctx!.globalAlpha = 1;
      continue;
    }
    const selected = player.id === control0.id || player.id === control1?.id;
    if (selected) {
      ctx!.beginPath(); ctx!.ellipse(player.x, player.y + 2, 13, 5, 0, 0, Math.PI * 2);
      ctx!.strokeStyle = player.team === 0 ? C.coral : C.cyan;
      ctx!.lineWidth = 2; ctx!.stroke();
      rect(ctx!, player.x - 2, player.y - 42 - player.z, 4, 4, C.gold);
    }
    if (player.state === 'hit') {
      line(ctx!, player.x - 14, player.y - 33 - player.z, player.x - 11, player.y - 38 - player.z, C.gold, 2);
      line(ctx!, player.x + 11, player.y - 35 - player.z, player.x + 15, player.y - 40 - player.z, C.gold, 2);
    }
    sprite(ctx!, player.character, player.team, player.x, player.y, player.facing, player.state, match.tick, player.z, 1, ballOwners.has(player.id));
    if (player.lane === 'inner') {
      rect(ctx!, player.x - 10, player.y - 37 - player.z, 20, 3, '#273344');
      rect(ctx!, player.x - 9, player.y - 36 - player.z, 18 * player.hp / player.maxHp, 1, player.team === 0 ? C.coral : C.cyan);
    }
  }
  drawBall(match);
  for (const particle of effects) {
    ctx!.globalAlpha = particle.life / particle.max;
    rect(ctx!, particle.x, particle.y, particle.size, particle.size, particle.color);
  }
  ctx!.globalAlpha = 1;
  ctx!.restore();
  drawHUD(match);
  if (bannerTicks > 0) {
    panel(ctx!, 150, 68, 180, 25, '#26374a', C.gold);
    text(ctx!, banner, 240, 73, 12, C.cream, 'center');
  }
}

function drawPause(): void {
  drawMatch();
  rect(ctx!, 0, 0, 480, 270, '#0b1524c9');
  panel(ctx!, 118, 36, 244, 203, '#26384c', C.gold);
  text(ctx!, 'PAUSED', 240, 51, 27, C.cream, 'center', 900);
  text(ctx!, '暫停', 240, 87, 12, C.gold, 'center');
  button(151, 109, 178, 29, '繼續比賽', true, () => setScreen('match'));
  button(151, 149, 178, 29, '重新開始', false, () => startMatch());
  button(151, 189, 178, 29, '返回主選單', false, () => setScreen('menu'));
}

function drawResult(): void {
  drawMatch();
  rect(ctx!, 0, 0, 480, 270, '#0b1524d4');
  panel(ctx!, 91, 41, 298, 191, '#26384c', C.gold);
  text(ctx!, 'MATCH COMPLETE', 240, 55, 11, C.gold, 'center');
  const winner = match?.winner;
  text(ctx!, winner === null ? '平局' : winner === 0 ? 'EMBER 勝利' : 'TIDE 勝利', 240, 79, 25, winner === 1 ? C.cyan : C.coral, 'center', 900);
  text(ctx!, `比賽時間  ${match ? Math.floor(match.tick / 60) : 0} 秒`, 240, 117, 10, C.cream, 'center');
  const leftAlive = match?.players.filter(p => p.team === 0 && p.lane === 'inner' && p.state !== 'out').length ?? 0;
  const rightAlive = match?.players.filter(p => p.team === 1 && p.lane === 'inner' && p.state !== 'out').length ?? 0;
  text(ctx!, `內野存活   EMBER ${leftAlive}  :  ${rightAlive} TIDE`, 240, 136, 10, C.muted, 'center');
  button(134, 163, 212, 27, '再戰一場', true, () => startMatch());
  button(134, 196, 212, 27, '返回主選單', false, () => setScreen('menu'));
}

function drawMusicButton(): void {
  const inMatch = screen === 'match';
  const x = inMatch ? 399 : 391;
  const y = inMatch ? 251 : 9;
  const width = inMatch ? 76 : 79;
  panel(ctx!, x, y, width, 17, C.deep2, music.enabled ? C.cyan : '#647889');
  text(ctx!, 'M  MUSIC ' + (music.enabled ? 'ON' : 'OFF'), x + 7, y + 4, 8,
    music.enabled ? C.cream : C.muted);
  regions.push({ x, y, w: width, h: 17, action: () => {
    document.body.dataset.music = music.toggle() ? 'on' : 'off';
  } });
}

function draw(): void {
  regions.length = 0;
  ctx!.clearRect(0, 0, 480, 270);
  if (screen === 'menu') drawMenu();
  else if (screen === 'select') drawSelect();
  else if (screen === 'howto') drawHowto();
  else if (screen === 'match') drawMatch();
  else if (screen === 'pause') drawPause();
  else drawResult();
  drawMusicButton();
}

function confirmSelection(): void {
  const selected = CHARACTER_ORDER[selectionIndex]!;
  if (selecting === 0) {
    p1 = selected;
    if (mode === 'versus') {
      selecting = 1;
      selectionIndex = CHARACTER_ORDER.indexOf(p2);
      return;
    }
  } else p2 = selected;
  startMatch();
}

function startMatch(autoplay = false): void {
  match = new Match({ mode, difficulty, p1, p2, autoplay });
  effects = [];
  banner = '';
  bannerTicks = 0;
  specialsThrown = 0;
  shake = 0;
  keys.clear();
  setScreen('match');
}

function input(team: Team): InputFrame {
  const down = (code: string): boolean => keys.has(code);
  if (team === 0) return {
    x: Number(down('KeyD')) - Number(down('KeyA')),
    y: Number(down('KeyS')) - Number(down('KeyW')),
    dash: down('ShiftLeft'), jump: down('KeyR'), throw: down('KeyF') || down('Space'),
    catch: down('KeyG'), dodge: down('KeyQ'), pass: down('KeyE')
  };
  return {
    x: Number(down('ArrowRight')) - Number(down('ArrowLeft')),
    y: Number(down('ArrowDown')) - Number(down('ArrowUp')),
    dash: down('ShiftRight'), jump: down('KeyI'), throw: down('KeyK') || down('Enter'),
    catch: down('KeyL'), dodge: down('KeyO'), pass: down('KeyU')
  };
}

let audioContext: AudioContext | null = null;
function sound(event: GameEvent): void {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') void audioContext.resume();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    const specs = event.kind === 'hit' ? [130, 52, 0.18] : event.kind === 'catch' ? [610, 920, 0.13] : event.kind === 'throw' ? [230, 360, 0.1] : [420, 300, 0.08];
    osc.type = event.kind === 'hit' ? 'sawtooth' : event.kind === 'catch' ? 'sine' : 'square';
    osc.frequency.setValueAtTime(specs[0]!, now);
    osc.frequency.exponentialRampToValueAtTime(specs[1]!, now + specs[2]!);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + specs[2]!);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(now); osc.stop(now + specs[2]!);
  } catch { /* Audio is optional when a browser blocks it. */ }
}

function processEvent(event: GameEvent): void {
  if (event.kind === 'win') return;
  if (event.kind === 'throw' && event.special) specialsThrown++;
  sound(event);
  const count = event.kind === 'hit' ? 22 : event.kind === 'catch' ? 16 : 8;
  const color = event.kind === 'hit' ? C.gold : event.kind === 'catch' ? C.cyan : event.kind === 'throw' ? C.coral : C.cream;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.9 + 0.5;
    effects.push({ x: event.x, y: event.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 11 + Math.floor(Math.random() * 12), max: 23, color, size: 1 + Math.floor(Math.random() * 3) });
  }
  if (event.kind === 'hit') {
    shake = event.special ? 7 : 4;
    if (event.special) { banner = SPECIALS[event.special].name; bannerTicks = 48; }
  } else if (event.kind === 'catch') {
    banner = event.perfect ? 'PERFECT CATCH  /  反擊強化' : 'CATCH  /  接球成功';
    bannerTicks = 42;
  } else if (event.kind === 'throw' && event.special) {
    banner = SPECIALS[event.special].name;
    bannerTicks = 43;
  }
}

function update(): void {
  frames++;
  if (screen !== 'match' || !match) return;
  match.step(input(0), input(1));
  for (const event of match.events) processEvent(event);
  effects = effects.filter(particle => particle.life > 0);
  for (const particle of effects) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.91;
    particle.vy *= 0.91;
    particle.life--;
  }
  bannerTicks = Math.max(0, bannerTicks - 1);
  shake = Math.max(0, shake - 1);
  if (match.finished) setScreen('result');
}

function loop(time: number): void {
  if (!lastTime) lastTime = time;
  lag += Math.min(100, time - lastTime);
  lastTime = time;
  let steps = 0;
  while (lag >= STEP_MS && steps < 6) { update(); lag -= STEP_MS; steps++; }
  if (steps === 6) lag = Math.min(lag, STEP_MS);
  music.tick();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

document.addEventListener('visibilitychange', () => {
  lastTime = 0;
  lag = 0;
  if (document.hidden && screen === 'match') setScreen('pause');
});

addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Backspace'].includes(event.code)) event.preventDefault();
  if (event.code === 'KeyM') {
    if (!event.repeat) document.body.dataset.music = music.toggle() ? 'on' : 'off';
    return;
  }
  music.unlock();
  keys.add(event.code);
  if (event.repeat) return;
  if (screen === 'match') {
    if (event.code === 'Escape' || event.code === 'KeyP') setScreen('pause');
    return;
  }
  if (screen === 'pause') {
    if (event.code === 'Escape' || event.code === 'KeyP' || event.code === 'Enter') setScreen('match');
    else if (event.code === 'Backspace') setScreen('menu');
    return;
  }
  if (screen === 'result') {
    if (event.code === 'Enter' || event.code === 'Space') startMatch();
    else if (event.code === 'Escape' || event.code === 'Backspace') setScreen('menu');
    return;
  }
  if (screen === 'howto') { if (['Escape', 'Enter', 'Backspace', 'Space'].includes(event.code)) setScreen('menu'); return; }
  if (screen === 'menu') {
    if (event.code === 'ArrowDown' || event.code === 'KeyS') menuIndex = (menuIndex + 1) % 3;
    if (event.code === 'ArrowUp' || event.code === 'KeyW') menuIndex = (menuIndex + 2) % 3;
    if (event.code === 'Enter' || event.code === 'Space') {
      if (menuIndex === 0) { mode = 'solo'; selecting = 0; setScreen('select'); }
      else if (menuIndex === 1) { mode = 'versus'; selecting = 0; setScreen('select'); }
      else setScreen('howto');
    }
    return;
  }
  if (screen === 'select') {
    if (['ArrowRight', 'KeyD'].includes(event.code)) selectionIndex = (selectionIndex + 1) % 6;
    if (['ArrowLeft', 'KeyA'].includes(event.code)) selectionIndex = (selectionIndex + 5) % 6;
    if (event.code === 'KeyZ' && mode === 'solo') difficulty = difficulty === 'easy' ? 'normal' : difficulty === 'normal' ? 'hard' : 'easy';
    if (event.code === 'Enter' || event.code === 'Space') confirmSelection();
    if (event.code === 'Escape' || event.code === 'Backspace') {
      if (selecting === 1) selecting = 0;
      else setScreen('menu');
    }
  }
});
addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', () => { keys.clear(); lastTime = 0; lag = 0; if (screen === 'match') setScreen('pause'); });
canvas.addEventListener('pointerdown', event => {
  music.unlock();
  const box = canvas!.getBoundingClientRect();
  const x = (event.clientX - box.left) * 480 / box.width;
  const y = (event.clientY - box.top) * 270 / box.height;
  const region = [...regions].reverse().find(item => x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h);
  region?.action();
  canvas!.focus();
});

declare global {
  interface Window {
    __DODGEBORN__?: {
      getState: () => { screen: Screen; mode: MatchMode; difficulty: Difficulty; tick: number; finished: boolean; winner: Team | null; hp: number[]; balls: number; specials: (string | null)[]; specialsThrown: number; control: { x: number; y: number }[]; music: { enabled: boolean; playing: boolean; scheduled: number } };
      start: (nextMode?: MatchMode, autoplay?: boolean) => void;
      advance: (ticks: number) => void;
      pause: () => void;
      resume: () => void;
      restart: () => void;
    };
  }
}
if (testMode) window.__DODGEBORN__ = {
  getState: () => ({ screen, mode, difficulty, tick: match?.tick ?? 0, finished: match?.finished ?? false, winner: match?.winner ?? null,
    hp: match?.players.filter(player => player.lane === 'inner').map(player => player.hp) ?? [], balls: match?.balls.length ?? 0,
    specials: match?.balls.map(ball => ball.special) ?? [], specialsThrown,
    control: match?.controlled.filter(player => player !== null).map(player => ({ x: player.x, y: player.y })) ?? [],
    music: music.status }),
  start: (nextMode = 'solo', autoplay = false) => { mode = nextMode; startMatch(autoplay); draw(); },
  advance: ticks => { for (let i = 0; i < ticks && screen === 'match'; i++) update(); draw(); },
  pause: () => { setScreen('pause'); draw(); },
  resume: () => { setScreen('match'); draw(); },
  restart: () => { startMatch(); draw(); }
};
