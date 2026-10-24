import { AI_SETTINGS, CHARACTER_ORDER, CHARACTERS, COURT, SPECIALS } from '../../content/src/index.ts';
import type { CharacterId, Difficulty, GameEvent, InputFrame, MatchMode, PlayerState, SpecialId, Team } from '../../shared/src/index.ts';

export interface Player {
  id: number;
  team: Team;
  lane: 'inner' | 'outer';
  character: CharacterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  vz: number;
  facing: number;
  hp: number;
  maxHp: number;
  state: PlayerState;
  stateTicks: number;
  runTicks: number;
  dashTicks: number;
  dashCooldown: number;
  dodgeTicks: number;
  dodgeCooldown: number;
  catchTicks: number;
  stunTicks: number;
  invulnTicks: number;
  throwCooldown: number;
  counterReady: boolean;
  holdingTicks: number;
  last: InputFrame;
  aiIntent: InputFrame;
  aiState: 'defend' | 'chase' | 'attack' | 'catch' | 'dodge';
  hitAttacks: Set<number>;
}

export interface Ball {
  id: number;
  attackId: number;
  mode: 'held' | 'free' | 'flight';
  kind: 'attack' | 'pass';
  ownerId: number | null;
  team: Team | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  damage: number;
  knockback: number;
  special: SpecialId | null;
  real: boolean;
  primary: boolean;
  targetId: number | null;
  turned: boolean;
  trail: { x: number; y: number }[];
}

export interface MatchOptions {
  mode?: MatchMode;
  difficulty?: Difficulty;
  p1?: CharacterId;
  p2?: CharacterId;
  seed?: number;
  autoplay?: boolean;
}

const ZERO: InputFrame = { x: 0, y: 0 };
const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);
const unit = (x: number, y: number): { x: number; y: number } => {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
};

export function segmentCircle(x1: number, y1: number, x2: number, y2: number, cx: number, cy: number, radius: number): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? clamp(((cx - x1) * dx + (cy - y1) * dy) / len2, 0, 1) : 0;
  return Math.hypot(x1 + t * dx - cx, y1 + t * dy - cy) <= radius;
}

function makePlayer(id: number, team: Team, lane: 'inner' | 'outer', character: CharacterId, x: number, y: number): Player {
  const def = CHARACTERS[character];
  return {
    id, team, lane, character, x, y, vx: 0, vy: 0, z: 0, vz: 0,
    facing: team === 0 ? 1 : -1, hp: lane === 'inner' ? def.hp : 0,
    maxHp: lane === 'inner' ? def.hp : 0, state: 'idle', stateTicks: 0,
    runTicks: 0, dashTicks: 0, dashCooldown: 0, dodgeTicks: 0,
    dodgeCooldown: 0, catchTicks: 0, stunTicks: 0, invulnTicks: 0,
    throwCooldown: 0, counterReady: false, holdingTicks: 0,
    last: ZERO, aiIntent: ZERO, aiState: 'defend', hitAttacks: new Set<number>()
  };
}

export class Match {
  readonly players: Player[] = [];
  readonly balls: Ball[] = [];
  readonly events: GameEvent[] = [];
  readonly mode: MatchMode;
  readonly difficulty: Difficulty;
  readonly autoplay: boolean;
  tick = 0;
  winner: Team | null = null;
  finished = false;
  hitStop = 0;
  passChain = 0;
  private seed: number;
  private ballSeq = 0;
  private attackSeq = 0;
  private control0 = 0;
  private control1 = 6;

  constructor(options: MatchOptions = {}) {
    this.mode = options.mode ?? 'solo';
    this.difficulty = options.difficulty ?? 'normal';
    this.autoplay = options.autoplay ?? false;
    this.seed = (options.seed ?? 0x0d0d6e) >>> 0;
    const left = this.roster(options.p1 ?? 'KAI');
    const right = this.roster(options.p2 ?? 'REX');
    const leftX = [134, 114, 154];
    const rightX = [346, 366, 326];
    const innerY = [110, 157, 202];
    const outerY = [93, 145, 197];
    for (let i = 0; i < 3; i++) {
      this.players.push(makePlayer(this.players.length, 0, 'inner', left[i]!, leftX[i]!, innerY[i]!));
    }
    for (let i = 0; i < 3; i++) {
      this.players.push(makePlayer(this.players.length, 0, 'outer', left[i + 3]!, 443, outerY[i]!));
    }
    for (let i = 0; i < 3; i++) {
      this.players.push(makePlayer(this.players.length, 1, 'inner', right[i]!, rightX[i]!, innerY[i]!));
    }
    for (let i = 0; i < 3; i++) {
      this.players.push(makePlayer(this.players.length, 1, 'outer', right[i + 3]!, 37, outerY[i]!));
    }
    this.balls.push(this.makeBall(0, 140, true));
    this.giveBall(this.balls[0]!, this.players[0]!);
  }

  get timeRemaining(): number {
    return Math.max(0, Math.ceil((COURT.durationTicks - this.tick) / 60));
  }

  get controlled(): [Player, Player | null] {
    return [this.players[this.control0]!, this.mode === 'versus' ? this.players[this.control1]! : null];
  }

  step(p1: InputFrame = ZERO, p2: InputFrame = ZERO): void {
    this.events.length = 0;
    if (this.finished) return;
    this.tick++;
    if (this.hitStop > 0) {
      this.hitStop--;
      return;
    }
    this.ensureControllers();
    for (const player of this.players) {
      if (player.state === 'out') continue;
      const input = !this.autoplay && player.id === this.control0 ? p1 : !this.autoplay && player.id === this.control1 && this.mode === 'versus' ? p2 : this.aiInput(player);
      this.updatePlayer(player, input);
    }
    for (const ball of [...this.balls]) if (this.balls.includes(ball)) this.updateBall(ball);
    this.balls.splice(0, this.balls.length, ...this.balls.filter(ball => ball.mode !== 'flight' || ball.age < 85));
    if (this.balls.length === 0) this.balls.push(this.makeBall(240, 140, true));
    this.checkResult();
  }

  private ensureControllers(): void {
    for (const team of [0, 1] as Team[]) {
      const current = team === 0 ? this.control0 : this.control1;
      if (this.players[current]?.state !== 'out') continue;
      const replacement = this.players.find(player => player.team === team && player.lane === 'inner' && player.state !== 'out');
      if (replacement) {
        if (team === 0) this.control0 = replacement.id;
        else this.control1 = replacement.id;
      }
    }
  }

  private roster(first: CharacterId): CharacterId[] {
    return [first, ...CHARACTER_ORDER.filter(id => id !== first)];
  }

  private random(): number {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }

  private makeBall(x: number, y: number, primary: boolean): Ball {
    return {
      id: ++this.ballSeq, attackId: 0, mode: 'free', kind: 'attack', ownerId: null,
      team: null, x, y, vx: 0, vy: 0, age: 0, damage: 0, knockback: 0,
      special: null, real: true, primary, targetId: null, turned: false, trail: []
    };
  }

  private hasBall(player: Player): Ball | undefined {
    return this.balls.find(ball => ball.mode === 'held' && ball.ownerId === player.id);
  }

  private giveBall(ball: Ball, player: Player): void {
    ball.mode = 'held';
    ball.ownerId = player.id;
    ball.team = player.team;
    ball.kind = 'attack';
    ball.special = null;
    ball.x = player.x + player.facing * 9;
    ball.y = player.y - player.z - 6;
    ball.vx = 0;
    ball.vy = 0;
    ball.age = 0;
    ball.real = true;
    ball.primary = true;
    ball.trail.length = 0;
    player.holdingTicks = 0;
  }

  private pressed(player: Player, input: InputFrame, key: keyof Pick<InputFrame, 'dash' | 'jump' | 'throw' | 'pass' | 'catch' | 'dodge'>): boolean {
    return !!input[key] && !player.last[key];
  }

  private bounds(player: Player): { minX: number; maxX: number } {
    if (player.lane === 'inner') return player.team === 0 ? COURT.leftInner : COURT.rightInner;
    return player.team === 0 ? COURT.leftOuter : COURT.rightOuter;
  }

  private updatePlayer(player: Player, input: InputFrame): void {
    player.stateTicks++;
    player.dashCooldown = Math.max(0, player.dashCooldown - 1);
    player.dodgeCooldown = Math.max(0, player.dodgeCooldown - 1);
    player.throwCooldown = Math.max(0, player.throwCooldown - 1);
    player.invulnTicks = Math.max(0, player.invulnTicks - 1);
    player.catchTicks = Math.max(0, player.catchTicks - 1);
    if (this.hasBall(player)) player.holdingTicks++;
    if (player.stunTicks > 0) {
      player.stunTicks--;
      player.x += player.vx;
      player.y += player.vy;
      player.vx *= 0.82;
      player.vy *= 0.82;
      player.state = player.stunTicks ? 'hit' : 'idle';
    } else {
      const move = unit(input.x, input.y);
      const moving = Math.abs(input.x) + Math.abs(input.y) > 0;
      if (this.pressed(player, input, 'dash') && moving && player.dashCooldown === 0) {
        player.dashTicks = 12;
        player.dashCooldown = 35;
        player.runTicks = Math.min(80, player.runTicks + 10);
      }
      if (this.pressed(player, input, 'dodge') && player.dodgeCooldown === 0) {
        player.dodgeTicks = 11;
        player.dodgeCooldown = 38;
        player.invulnTicks = Math.max(player.invulnTicks, 8);
        player.vx = (moving ? move.x : player.facing) * 3.6;
        player.vy = (moving ? move.y : 0) * 3.6;
        player.state = 'dodge';
        player.stateTicks = 0;
      }
      if (this.pressed(player, input, 'jump') && player.z === 0 && player.dodgeTicks === 0) {
        player.vz = 3.6;
        player.z = 0.1;
        player.state = 'jump';
        player.stateTicks = 0;
      }
      if (this.pressed(player, input, 'catch')) {
        player.catchTicks = 11 + Math.round(CHARACTERS[player.character].catch / 30);
        player.state = 'catch';
        player.stateTicks = 0;
      }
      if (player.dodgeTicks > 0) {
        player.dodgeTicks--;
        player.x += player.vx;
        player.y += player.vy;
      } else {
        const speed = (0.9 + CHARACTERS[player.character].speed / 74) * (player.dashTicks > 0 ? 1.72 : 1);
        player.vx = moving ? move.x * speed : 0;
        player.vy = moving ? move.y * speed : 0;
        player.x += player.vx;
        player.y += player.vy;
        if (moving) {
          player.runTicks = Math.min(80, player.runTicks + (player.dashTicks > 0 ? 2 : 1));
          if (Math.abs(move.x) > 0.1) player.facing = move.x > 0 ? 1 : -1;
        } else if (player.z === 0) player.runTicks = Math.max(0, player.runTicks - 1);
      }
      player.dashTicks = Math.max(0, player.dashTicks - 1);
      if (player.z > 0) {
        player.z += player.vz;
        player.vz -= 0.29;
        if (player.z <= 0) { player.z = 0; player.vz = 0; }
      }
      const held = this.hasBall(player);
      if (held && player.throwCooldown === 0 && this.pressed(player, input, 'pass')) this.launch(player, held, true);
      else if (held && player.throwCooldown === 0 && this.pressed(player, input, 'throw')) this.launch(player, held, false);
      if (player.state !== 'throw' || player.stateTicks > 8) {
        if (player.stunTicks > 0) player.state = 'hit';
        else if (player.dodgeTicks > 0) player.state = 'dodge';
        else if (player.catchTicks > 0) player.state = 'catch';
        else if (player.z > 0) player.state = 'jump';
        else if (player.dashTicks > 0) player.state = 'dash';
        else player.state = moving ? 'run' : 'idle';
      }
    }
    const bounds = this.bounds(player);
    player.x = clamp(player.x, bounds.minX, bounds.maxX);
    player.y = clamp(player.y, COURT.top + 10, COURT.bottom - 8);
    player.last = { ...input };
  }

  private pickTarget(player: Player): Player | undefined {
    return this.players.filter(other => other.team !== player.team && other.lane === 'inner' && other.state !== 'out')
      .sort((a, b) => distance(a, player) - distance(b, player))[0];
  }

  private launch(player: Player, ball: Ball, isPass: boolean): void {
    const special = !isPass && player.z >= 5 && player.runTicks >= 18 ? CHARACTERS[player.character].special : null;
    const allies = this.players.filter(other => other.team === player.team && other.id !== player.id && other.state !== 'out');
    const target = isPass
      ? allies.sort((a, b) => (a.lane === 'outer' ? -1 : 1) - (b.lane === 'outer' ? -1 : 1) || distance(a, player) - distance(b, player))[0]
      : this.pickTarget(player);
    if (!target) return;
    const def = special ? SPECIALS[special] : null;
    const speed = def?.speed ?? 5.3 + CHARACTERS[player.character].throw / 38;
    const damage = isPass ? 0 : Math.round((def?.damage ?? 8 + CHARACTERS[player.character].throw / 20) * (player.counterReady ? 1.32 : 1));
    const human = !this.autoplay && (player.id === this.control0 || (player.id === this.control1 && this.mode === 'versus'));
    const noise = human ? 0 : (this.random() - 0.5) * AI_SETTINGS[this.difficulty].accuracy;
    const aim = unit(target.x - player.x, target.y - player.y + noise);
    ball.mode = 'flight';
    ball.kind = isPass ? 'pass' : 'attack';
    ball.ownerId = null;
    ball.team = player.team;
    ball.x = player.x + aim.x * 12;
    ball.y = player.y - 5 + aim.y * 12;
    ball.vx = aim.x * (isPass ? 6 : speed);
    ball.vy = aim.y * (isPass ? 6 : speed);
    ball.age = 0;
    ball.attackId = ++this.attackSeq;
    ball.damage = damage;
    ball.knockback = def?.knockback ?? 5;
    ball.special = special;
    ball.targetId = target.id;
    ball.turned = false;
    ball.trail.length = 0;
    player.counterReady = false;
    player.throwCooldown = 14;
    player.state = 'throw';
    player.stateTicks = 0;
    if (isPass) this.passChain++;
    else this.passChain = 0;
    this.events.push({ kind: 'throw', x: ball.x, y: ball.y, team: player.team, special });
    if (special === 'phantom' || special === 'meteor') {
      for (const side of [-1, 1]) {
        const echo = this.makeBall(ball.x, ball.y + side * 7, false);
        Object.assign(echo, {
          mode: 'flight', kind: 'attack', team: player.team, attackId: ball.attackId,
          vx: ball.vx * (side === 1 ? 0.91 : 1.08), vy: ball.vy + side * 0.44,
          damage: special === 'meteor' ? 13 : 0, knockback: 5,
          special, real: special === 'meteor', primary: false, targetId: target.id
        });
        this.balls.push(echo);
      }
    }
  }

  private updateBall(ball: Ball): void {
    if (ball.mode === 'held') {
      const owner = this.players[ball.ownerId ?? -1];
      if (!owner || owner.state === 'out') { ball.mode = 'free'; ball.ownerId = null; return; }
      ball.x = owner.x + owner.facing * 10;
      ball.y = owner.y - owner.z - 7;
      return;
    }
    if (ball.mode === 'free') {
      ball.x = clamp(ball.x + ball.vx, 14, 466);
      ball.y = clamp(ball.y + ball.vy, COURT.top + 3, COURT.bottom - 3);
      ball.vx *= 0.93;
      ball.vy *= 0.93;
      const near = this.players.filter(player => player.state !== 'out' && player.stunTicks === 0 && !this.hasBall(player) && distance(player, ball) < 13)
        .sort((a, b) => distance(a, ball) - distance(b, ball))[0];
      if (near && !this.balls.some(other => other.mode === 'held')) {
        this.giveBall(ball, near);
        this.events.push({ kind: 'pickup', x: near.x, y: near.y, team: near.team });
      }
      return;
    }
    const px = ball.x;
    const py = ball.y;
    ball.age++;
    if (ball.special === 'lightning' && ball.age === 13 && !ball.turned) {
      const target = this.players[ball.targetId ?? -1];
      if (target && target.state !== 'out') {
        const direction = unit(target.x - ball.x, target.y - ball.y);
        ball.vx = direction.x * SPECIALS.lightning.speed;
        ball.vy = direction.y * SPECIALS.lightning.speed;
      }
      ball.turned = true;
    }
    ball.x += ball.vx;
    ball.y += ball.vy + (ball.special === 'wind' ? Math.sin(ball.age * 0.66) * 2.9 : 0);
    ball.trail.unshift({ x: px, y: py });
    if (ball.trail.length > 7) ball.trail.pop();
    for (const player of this.players) {
      if (player.state === 'out' || player.id === ball.ownerId) continue;
      if (ball.kind === 'pass' && player.team === ball.team && segmentCircle(px, py, ball.x, ball.y, player.x, player.y - 5, 10)) {
        this.giveBall(ball, player);
        this.events.push({ kind: 'pickup', x: player.x, y: player.y, team: player.team });
        return;
      }
      if (player.team === ball.team || ball.kind === 'pass' || !ball.real || player.invulnTicks > 0 || player.hitAttacks.has(ball.attackId)) continue;
      if (!segmentCircle(px, py, ball.x, ball.y, player.x, player.y - 5 - player.z * 0.25, 11)) continue;
      if (player.catchTicks > 0) {
        const perfect = player.catchTicks >= 9;
        this.catchBall(ball, player, perfect);
        return;
      }
      if (player.z > 15 || player.dodgeTicks > 0) continue;
      this.hitPlayer(ball, player);
      if (ball.primary) {
        ball.mode = 'free';
        ball.team = null;
        ball.special = null;
        ball.vx *= 0.27;
        ball.vy *= 0.27;
        ball.age = 0;
      } else ball.age = 90;
      return;
    }
    if (ball.x < 9 || ball.x > 471 || ball.y < COURT.top - 12 || ball.y > COURT.bottom + 10 || ball.age >= 82) {
      if (ball.primary) {
        ball.mode = 'free';
        ball.x = clamp(ball.x, 20, 460);
        ball.y = clamp(ball.y, COURT.top + 6, COURT.bottom - 6);
        ball.vx *= -0.18;
        ball.vy *= -0.18;
        ball.age = 0;
        ball.team = null;
        ball.special = null;
      } else ball.age = 90;
    }
  }

  private catchBall(ball: Ball, player: Player, perfect: boolean): void {
    this.balls.splice(0, this.balls.length, ...this.balls.filter(other => other.attackId !== ball.attackId || other.id === ball.id));
    this.giveBall(ball, player);
    player.counterReady = perfect;
    player.catchTicks = 0;
    player.state = 'catch';
    player.stateTicks = 0;
    this.passChain = 0;
    this.hitStop = perfect ? 4 : 2;
    this.events.push({ kind: 'catch', x: player.x, y: player.y, team: player.team, perfect });
  }

  private hitPlayer(ball: Ball, player: Player): void {
    player.hitAttacks.add(ball.attackId);
    this.applyDamage(player, ball.damage, ball.knockback, ball.vx, ball.vy, ball.special);
    if (ball.special === 'gravity') {
      for (const other of this.players) {
        if (other.id === player.id || other.team === ball.team || other.state === 'out' || distance(other, player) > 29 || other.hitAttacks.has(ball.attackId)) continue;
        other.hitAttacks.add(ball.attackId);
        this.applyDamage(other, 9, 10, ball.vx, ball.vy, ball.special);
      }
    }
  }

  private applyDamage(player: Player, damage: number, knockback: number, dx: number, dy: number, special: SpecialId | null): void {
    if (player.lane === 'inner') player.hp = Math.max(0, player.hp - damage);
    player.vx = Math.sign(dx || 1) * knockback * 0.55;
    player.vy = Math.sign(dy || (this.random() > 0.5 ? 1 : -1)) * knockback * 0.2;
    player.stunTicks = Math.round(9 + knockback * 0.6);
    player.invulnTicks = 14;
    player.state = player.hp <= 0 && player.lane === 'inner' ? 'down' : 'hit';
    player.stateTicks = 0;
    this.hitStop = Math.max(this.hitStop, special ? 5 : 3);
    this.events.push({ kind: 'hit', x: player.x, y: player.y, team: player.team, damage, special });
    if (player.hp <= 0 && player.lane === 'inner') {
      player.state = 'out';
      player.stunTicks = 0;
      this.events.push({ kind: 'out', x: player.x, y: player.y, team: player.team });
      const held = this.hasBall(player);
      if (held) { held.mode = 'free'; held.ownerId = null; }
    }
  }

  private aiInput(player: Player): InputFrame {
    const settings = AI_SETTINGS[this.difficulty];
    if (this.tick % settings.reaction !== player.id % settings.reaction) return { ...player.aiIntent, throw: false, pass: false, catch: false, dodge: false, jump: false, dash: false };
    const held = this.hasBall(player);
    const input: InputFrame = { x: 0, y: 0 };
    const incoming = this.balls.filter(ball => ball.mode === 'flight' && ball.kind === 'attack' && ball.team !== player.team && ball.real)
      .sort((a, b) => distance(a, player) - distance(b, player))[0];
    const threat = !!incoming && distance(incoming, player) < 95
      && segmentCircle(incoming.x, incoming.y, incoming.x + incoming.vx * 12, incoming.y + incoming.vy * 12, player.x, player.y - 5, 16);
    const free = this.balls.filter(ball => ball.mode === 'free').sort((a, b) => distance(a, player) - distance(b, player))[0];
    const teammates = this.players.filter(other => other.team === player.team && other.state !== 'out' && other.lane === player.lane);
    const closest = free ? teammates.sort((a, b) => distance(a, free) - distance(b, free))[0] : null;
    // Utility scores choose the next finite state from observed ball and team positions.
    // Difficulty changes how soon the choice is reconsidered and whether a defense is attempted.
    const scores: Record<Player['aiState'], number> = {
      catch: threat && player.catchTicks === 0 && this.random() < settings.catchChance ? 110 + CHARACTERS[player.character].catch / 20 : -1,
      dodge: threat && player.dodgeCooldown === 0 && this.random() < settings.dodgeChance ? 102 : -1,
      attack: held ? 70 + Math.min(25, player.holdingTicks / 5) : -1,
      chase: free && closest?.id === player.id && distance(free, player) < 155 ? 55 - distance(free, player) / 12 : -1,
      defend: 10
    };
    player.aiState = (Object.keys(scores) as Player['aiState'][]).reduce((best, state) => scores[state] > scores[best] ? state : best, 'defend');
    if (player.aiState === 'catch') input.catch = true;
    else if (player.aiState === 'dodge' && incoming) {
      input.y = incoming.y > player.y ? -1 : 1;
      input.dodge = true;
    } else if (player.aiState === 'attack') {
      const target = this.pickTarget(player);
      if (target) {
        const attackX = player.team === 0 ? (player.lane === 'inner' ? 207 : 432) : (player.lane === 'inner' ? 273 : 48);
        input.x = Math.abs(player.x - attackX) > 5 ? Math.sign(attackX - player.x) : 0;
        input.y = Math.abs(player.y - target.y) > 12 ? Math.sign(target.y - player.y) : 0;
        if (player.holdingTicks > 16 && player.runTicks >= 18 && player.z === 0 && player.holdingTicks < settings.attackDelay + 15) input.jump = true;
        if (player.z > 5 || player.holdingTicks > settings.attackDelay || player.holdingTicks > 135) {
          if (player.lane === 'inner' && this.passChain < 2 && player.holdingTicks < 55 && this.random() < 0.08) input.pass = true;
          else input.throw = true;
        }
        if (Math.abs(player.x - attackX) > 30 && player.dashCooldown === 0 && this.random() < 0.42) input.dash = true;
      }
    } else {
      if (player.aiState === 'chase' && free) {
        input.x = Math.abs(free.x - player.x) > 5 ? Math.sign(free.x - player.x) : 0;
        input.y = Math.abs(free.y - player.y) > 5 ? Math.sign(free.y - player.y) : 0;
      } else {
        const slot = player.id % 3;
        const homeX = player.lane === 'outer' ? (player.team === 0 ? 443 : 37) : (player.team === 0 ? 120 + slot * 25 : 360 - slot * 25);
        const homeY = [106, 156, 201][slot]!;
        input.x = Math.abs(homeX - player.x) > 10 ? Math.sign(homeX - player.x) : 0;
        input.y = Math.abs(homeY - player.y) > 10 ? Math.sign(homeY - player.y) : 0;
      }
    }
    player.aiIntent = { x: input.x, y: input.y };
    return input;
  }

  private checkResult(): void {
    const alive = ([0, 1] as Team[]).map(team => this.players.filter(player => player.team === team && player.lane === 'inner' && player.state !== 'out'));
    if (alive[0]!.length && alive[1]!.length && this.tick < COURT.durationTicks) return;
    this.finished = true;
    if (alive[0]!.length === 0) this.winner = 1;
    else if (alive[1]!.length === 0) this.winner = 0;
    else {
      const hp0 = alive[0]!.reduce((sum, player) => sum + player.hp, 0);
      const hp1 = alive[1]!.reduce((sum, player) => sum + player.hp, 0);
      this.winner = hp0 === hp1 ? null : hp0 > hp1 ? 0 : 1;
    }
    this.events.push({ kind: 'win', team: this.winner });
  }
}
