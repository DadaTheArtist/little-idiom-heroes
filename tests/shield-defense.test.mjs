import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GameRegistry } from '../js/core/game-registry.js';
import {
  createGateQueue,
  createVisibleGateQueue,
  getGateResolutionClass
} from '../js/games/shield-defense.js';

test('shield-defense is presented as gate checkpoint', () => {
  const game = new GameRegistry().get('shield-defense');

  assert.equal(game.displayName, '城門查哨站');
  assert.match(game.description, /守衛|入城|放行/);
});

test('createGateQueue creates one waiting person per question', () => {
  const queue = createGateQueue(4, 1);

  assert.equal(queue.length, 4);
  assert.deepEqual(
    queue.map((person) => person.status),
    ['done', 'current', 'waiting', 'waiting']
  );
});

test('createVisibleGateQueue removes processed people so the line moves forward', () => {
  const queue = createVisibleGateQueue(4, 2);

  assert.deepEqual(
    queue.map((person) => [person.number, person.status]),
    [[3, 'current'], [4, 'waiting']]
  );
});

test('getGateResolutionClass maps answers to admission states', () => {
  assert.equal(getGateResolutionClass(true), 'admitted');
  assert.equal(getGateResolutionClass(false), 'rejected');
});

test('gate checkpoint styles include guard, gate, and person resolution states', () => {
  const css = readFileSync(new URL('../css/games/shield-defense.css', import.meta.url), 'utf8');

  assert.match(css, /\.shield-guard/);
  assert.match(css, /\.shield-gate/);
  assert.match(css, /\.shield-person\.admitted/);
  assert.match(css, /\.shield-person\.rejected/);
});
