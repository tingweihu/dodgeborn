import assert from 'node:assert/strict';
import { test } from '../test-api.ts';
import { Match } from '../../packages/core/src/index.ts';

test('two local players move independently and the match can restart from clean state', () => {
  const game = new Match({ mode: 'versus' });
  const left = game.players[0]!;
  const right = game.players[6]!;
  const before = [left.x, right.x];
  game.step({ x: 1, y: 0 }, { x: -1, y: 0 });
  assert.ok(left.x > before[0]!);
  assert.ok(right.x < before[1]!);
  const restarted = new Match({ mode: 'versus' });
  assert.equal(restarted.tick, 0);
  assert.equal(restarted.players[0]?.hp, restarted.players[0]?.maxHp);
  assert.equal(restarted.balls[0]?.ownerId, 0);
});

test('control transfers to the next living inner teammate after elimination', () => {
  const game = new Match({ mode: 'versus' });
  game.players[0]!.state = 'out';
  game.players[0]!.hp = 0;
  game.step({ x: 1, y: 0 });
  assert.equal(game.controlled[0].id, 1);
  assert.ok(game.players[1]!.x > 114);
});

test('removing all three inner players ends the match while outer players remain', () => {
  const game = new Match();
  for (const player of game.players.filter(player => player.team === 1 && player.lane === 'inner')) {
    player.hp = 0;
    player.state = 'out';
  }
  game.step();
  assert.equal(game.finished, true);
  assert.equal(game.winner, 0);
  assert.equal(game.players.filter(player => player.team === 1 && player.lane === 'outer' && player.state !== 'out').length, 3);
});

test('time limit resolves by remaining inner HP', () => {
  const game = new Match();
  game.tick = 180 * 60 - 1;
  game.players[6]!.hp -= 8;
  game.step();
  assert.equal(game.finished, true);
  assert.equal(game.winner, 0);
});
