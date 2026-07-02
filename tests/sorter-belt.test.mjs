import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getNextConveyorLane } from '../js/games/sorter-belt.js';

function getCssRule(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`));
  return match?.[1] || '';
}

test('getNextConveyorLane rotates through lanes to avoid left-edge overlap', () => {
  assert.equal(getNextConveyorLane(-1, 3), 0);
  assert.equal(getNextConveyorLane(0, 3), 1);
  assert.equal(getNextConveyorLane(1, 3), 2);
  assert.equal(getNextConveyorLane(2, 3), 0);
});

test('wrong sorter card renders a cross mark', () => {
  const css = readFileSync(new URL('../css/games/sorter-belt.css', import.meta.url), 'utf8');

  assert.match(css, /\.sorter-card(?:\.moving)?\.wrong::after/);
  assert.match(css, /content:\s*['"]✕['"]/);
});

test('sorter belt is thick enough to visually carry conveyor boxes', () => {
  const css = readFileSync(new URL('../css/games/sorter-belt.css', import.meta.url), 'utf8');
  const beltLine = getCssRule(css, '.sorter-belt-line');
  const height = Number(beltLine.match(/height:\s*(\d+)px/)?.[1] || 0);

  assert.ok(height >= 76, `expected belt height >= 76px, got ${height}px`);
});
