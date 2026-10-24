import assert from 'node:assert/strict';
import { test } from '../test-api.ts';
import { Match, segmentCircle } from '../../packages/core/src/index.ts';
import { CHARACTER_ORDER, CHARACTERS, SPECIALS } from '../../packages/content/src/index.ts';
import type { CharacterId } from '../../packages/shared/src/index.ts';

test('six original character records and six distinct specials are centralized', () => {
  assert.equal(CHARACTER_ORDER.length, 6);
  assert.equal(new Set(CHARACTER_ORDER.map(id => CHARACTERS[id].special)).size, 6);
  assert.deepEqual(CHARACTER_ORDER.map(id => CHARACTERS[id].hp), [100, 115, 85, 90, 125, 90]);
  for (const id of CHARACTER_ORDER) assert.ok(SPECIALS[CHARACTERS[id].special].damage > 0);
});

test('initial formation has three inner and three outer players per team', () => {
  const game = new Match({ p1: 'LUX', p2: 'BRUTUS' });
  for (const team of [0, 1]) {
    assert.equal(game.players.filter(p => p.team === team && p.lane === 'inner').length, 3);
    assert.equal(game.players.filter(p => p.team === team && p.lane === 'outer').length, 3);
  }
  assert.equal(game.players[0]?.character, 'LUX');
  assert.equal(game.players[6]?.character, 'BRUTUS');
  assert.equal(game.balls[0]?.ownerId, 0);
});

test('swept segment catches a high-speed crossing missed by endpoint checks', () => {
  assert.equal(segmentCircle(0, 0, 100, 0, 50, 0, 8), true);
  assert.equal(segmentCircle(0, 0, 100, 0, 50, 20, 8), false);
});

function launchSpecial(id: CharacterId): Match {
  const game = new Match({ p1: id, mode: 'versus' });
  for (let i = 0; i < 22; i++) game.step({ x: 1, y: 0 });
  game.step({ x: 1, y: 0, jump: true });
  game.step({ x: 1, y: 0 });
  game.step({ x: 1, y: 0, throw: true });
  return game;
}

test('run, jump and timed release trigger all six distinct special attacks', () => {
  for (const id of CHARACTER_ORDER) {
    const game = launchSpecial(id);
    assert.equal(game.balls[0]?.special, CHARACTERS[id].special, `${id} special`);
    assert.equal(game.balls[0]?.mode, 'flight');
    assert.ok((game.balls[0]?.damage ?? 0) > 0);
  }
});

test('lightning changes direction mid-flight and wind changes vertical trajectory', () => {
  const lightning = launchSpecial('NOVA');
  const bolt = lightning.balls[0]!;
  bolt.x = 220; bolt.y = 105; bolt.vx = 8; bolt.vy = 0; bolt.age = 12;
  lightning.players[6]!.y = 200;
  lightning.players[6]!.stunTicks = 100;
  lightning.step({ x: 0, y: 0 });
  assert.equal(bolt.turned, true);
  assert.ok(bolt.vy > 0);

  const wind = launchSpecial('MIO');
  const gust = wind.balls[0]!;
  gust.x = 220; gust.y = 95; gust.vx = 8; gust.vy = 0; gust.age = 0;
  wind.step({ x: 0, y: 0 });
  assert.notEqual(gust.y, 95);
});

test('phantom uses fake visual balls while meteor creates three damaging projectiles', () => {
  const phantom = launchSpecial('LUX');
  assert.equal(phantom.balls.length, 3);
  assert.equal(phantom.balls.filter(ball => ball.real).length, 1);
  const meteor = launchSpecial('BRUTUS');
  assert.equal(meteor.balls.length, 3);
  assert.equal(meteor.balls.filter(ball => ball.real).length, 3);
  assert.equal(new Set(meteor.balls.map(ball => ball.attackId)).size, 1);
});

test('gravity burst affects nearby inner players once and outer hits never eliminate', () => {
  const game = new Match();
  const ball = game.balls[0]!;
  const first = game.players[6]!;
  const second = game.players[7]!;
  first.x = 280; first.y = 110; first.stunTicks = 100;
  second.x = 284; second.y = 126; second.stunTicks = 100;
  Object.assign(ball, { mode: 'flight', ownerId: null, team: 0, x: 261, y: 105, vx: 22, vy: 0,
    attackId: 77, damage: 23, knockback: 16, special: 'gravity', age: 0 });
  game.step();
  assert.equal(first.hp, first.maxHp - 23);
  assert.equal(second.hp, second.maxHp - 9);
  assert.equal(first.hitAttacks.size, 1);
  assert.equal(second.hitAttacks.size, 1);
  const outer = game.players[9]!;
  assert.equal(outer.hp, 0);
  assert.notEqual(outer.state, 'out');
});

test('one attack cannot damage the same player twice, even with multiple real balls', () => {
  const game = new Match();
  const ball = game.balls[0]!;
  const victim = game.players[6]!;
  victim.x = 280; victim.y = 110; victim.stunTicks = 100;
  Object.assign(ball, { mode: 'flight', ownerId: null, team: 0, x: 260, y: 105, vx: 24, vy: 0,
    attackId: 98, damage: 18, knockback: 5, special: 'meteor', age: 0 });
  game.balls.push({ ...ball, id: 999, primary: false, trail: [] });
  game.step();
  assert.equal(victim.hp, victim.maxHp - 18);
  assert.equal(victim.hitAttacks.size, 1);
});

test('timed catch grants a powered counter and dodge prevents damage', () => {
  const caught = new Match({ mode: 'versus' });
  const defender = caught.players[6]!;
  const ball = caught.balls[0]!;
  Object.assign(ball, { mode: 'flight', ownerId: null, team: 0, x: defender.x - 17, y: defender.y - 5,
    vx: 15, vy: 0, attackId: 41, damage: 24, knockback: 5, age: 0 });
  caught.step({ x: 0, y: 0 }, { x: 0, y: 0, catch: true });
  assert.equal(defender.hp, defender.maxHp);
  assert.equal(ball.ownerId, defender.id);
  assert.equal(defender.counterReady, true);
  for (let i = 0; i < 4; i++) caught.step();
  caught.step({ x: 0, y: 0 }, { x: 0, y: 0, throw: true });
  assert.equal(defender.counterReady, false);
  assert.ok(ball.damage > 12);

  const dodged = new Match({ mode: 'versus' });
  const evader = dodged.players[6]!;
  const shot = dodged.balls[0]!;
  Object.assign(shot, { mode: 'flight', ownerId: null, team: 0, x: evader.x - 17, y: evader.y - 5,
    vx: 15, vy: 0, attackId: 42, damage: 24, knockback: 5, age: 0 });
  dodged.step({ x: 0, y: 0 }, { x: 0, y: 1, dodge: true });
  assert.equal(evader.hp, evader.maxHp);
});

test('pass transfers possession to an outer teammate without causing friendly damage', () => {
  const game = new Match({ mode: 'versus' });
  const outer = game.players[3]!;
  const first = game.players[0]!;
  outer.x = 435;
  outer.y = first.y;
  game.step({ x: 0, y: 0, pass: true });
  assert.equal(game.balls[0]?.kind, 'pass');
  for (let i = 0; i < 75 && game.balls[0]?.ownerId !== outer.id; i++) game.step();
  assert.equal(game.balls[0]?.ownerId, outer.id);
  assert.equal(first.hp, first.maxHp);
});
