# Task 01: Game Shell

## Goal

Create the minimal `maze-runner` game shell and register it so the app can import it without runtime errors.

## Worker Context

Use existing patterns from:

- `js/games/racing.js`
- `js/games/whack-a-mole.js`
- `css/games/whack-a-mole.css`
- `js/core/game-registry.js`
- `index.html`

Do not modify challenge data in this task.

## Files

- Create `js/games/maze-runner.js`
- Create `css/games/maze-runner.css`
- Modify `js/core/game-registry.js`
- Modify `index.html`

## Required Behavior

- `MazeRunner` must default-export a class extending `BaseGame`.
- It must render:
  - back button
  - progress
  - score
  - 3 hearts
  - shared hint button
  - question area
  - board area with a temporary loading message
  - directional controls
  - feedback area
- Back button must call the completion callback with zero stars and include `wrongAnswers`.
- `_getCurrentQuestion()` must return the active question for hints.
- `start()` must call `super.start()` and load the first question.
- Register `maze-runner` with:
  - display name `迷宮探險`
  - icon `🧭`
  - module path `./games/maze-runner.js`
  - supports `choice`
  - supports `tap-select`
- Import `css/games/maze-runner.css` in `index.html`.

## Acceptance Checks

- Starting `python3 -m http.server 8000` and opening the app shows the title screen without console import errors.
- `GameRegistry.get('maze-runner')` would return the new definition.
- No existing game behavior changes.

## Suggested Commit

```bash
git add index.html js/core/game-registry.js js/games/maze-runner.js css/games/maze-runner.css
git commit -m "feat: register maze runner game shell"
```

