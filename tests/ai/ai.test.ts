import assert from 'node:assert/strict';
import { test } from '../test-api.ts';
import { Match } from '../../packages/core/src/index.ts';
import { COURT } from '../../packages/content/src/index.ts';
import type { Difficulty } from '../../packages/shared/src/index.ts';

for (const difficulty of ['easy', 'normal', 'hard'] as Difficulty[]) {
  test(`${difficulty} AI completes a full match without hoarding or leaving court bounds`, () => {
    const game = new Match({ difficulty, autoplay: true, seed: 123 });
    let throws = 0;
    let longestHold = 0;
    let maxPassChain = 0;
    const states = new Set<string>();
    while (!game.finished && game.tick < COURT.durationTicks + 10) {
      game.step();
      throws += game.events.filter(event => event.kind === 'throw').length;
      longestHold = Math.max(longestHold, ...game.players.map(player => player.holdingTicks));
      maxPassChain = Math.max(maxPassChain, game.passChain);
      for (const player of game.players) states.add(player.aiState);
      if (game.tick % 90 === 0) for (const player of game.players) {
        if (player.state === 'out') continue;
        assert.ok(player.y >= COURT.top + 10 && player.y <= COURT.bottom - 8);
        const bounds = player.lane === 'outer'
          ? player.team === 0 ? COURT.leftOuter : COURT.rightOuter
          : player.team === 0 ? COURT.leftInner : COURT.rightInner;
        assert.ok(player.x >= bounds.minX && player.x <= bounds.maxX);
      }
    }
    assert.equal(game.finished, true);
    assert.ok(throws >= 15, `${throws} throws`);
    assert.ok(longestHold < 140, `${longestHold} max hold ticks`);
    assert.ok(maxPassChain <= 2, `${maxPassChain} consecutive passes`);
    assert.ok(states.has('attack') && states.has('chase') && states.has('defend'));
  });
}

test('same seed and input schedule produce identical match results', () => {
  const run = () => {
    const game = new Match({ difficulty: 'normal', autoplay: true, seed: 234 });
    while (!game.finished) game.step();
    return { tick: game.tick, winner: game.winner, hp: game.players.filter(player => player.lane === 'inner').map(player => player.hp) };
  };
  assert.deepEqual(run(), run());
});
