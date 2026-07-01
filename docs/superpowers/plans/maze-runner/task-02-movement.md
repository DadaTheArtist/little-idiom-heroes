# Task 02: Maze Movement

## Goal

Replace the temporary board with a playable grid maze where the hero moves with on-screen controls and desktop arrow keys.

## Worker Context

Task 01 should already have created `js/games/maze-runner.js` and `css/games/maze-runner.css`.

Keep movement grid-based. Do not implement answer correctness yet beyond detecting that the hero reached an answer gate.

## Files

- Modify `js/games/maze-runner.js`
- Modify `css/games/maze-runner.css`

## Required Behavior

- Use a 7x7 grid.
- Define at least two hand-authored layouts with:
  - `start`
  - `walls`
  - four `gates`
- Build answer options from `q.options` when present, otherwise from `q.answer` and `_getDistractors`.
- Deduplicate options and shuffle them.
- Render:
  - walls
  - floor cells
  - four answer gates
  - hero
- Direction buttons move the hero one cell when the target cell is inside the board and not a wall.
- Arrow keys map to the same movement.
- Blocked movement shows short feedback such as `走不通！`.
- Reaching a gate should call a stub path that will be completed in Task 03. It can show feedback with the selected answer for now.
- `destroy()` must remove the keydown listener.

## Acceptance Checks

- App loads without module errors.
- The maze board renders square.
- Buttons move the hero.
- Arrow keys move the hero.
- Walls block movement.
- Hero cannot move outside the board.
- No answer score or life logic is required yet.

## Suggested Commit

```bash
git add js/games/maze-runner.js css/games/maze-runner.css
git commit -m "feat: add maze runner movement"
```

