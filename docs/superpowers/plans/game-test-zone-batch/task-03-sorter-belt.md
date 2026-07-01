# Task 03: Sorter Belt Game

## Goal

Add the `sorter-belt` choice minigame.

## Files

- Create `js/games/sorter-belt.js`
- Create `css/games/sorter-belt.css`
- Modify `js/core/game-registry.js`
- Modify `index.html`

## Required Behavior

- Default export a `SorterBelt` class extending `BaseGame`.
- Supports `questionType: choice` and `answerMode: tap-select`.
- Render HUD with back button, progress, score, mistake hearts, hint button.
- Render a question card and four answer bins.
- Tapping a bin submits that answer.
- Correct answer increments score, marks selected bin correct, and advances.
- Wrong answer decrements mistake hearts, calls `_recordWrong(q, pickedAnswer)`, marks wrong bin, reveals correct bin, and advances.
- 0 hearts finishes early with current score.
- Back button completes with zero stars and current wrong answers.
- Clean up timers/listeners in `destroy()`.

## Acceptance Checks

- Module imports without errors.
- Registry returns `sorter-belt`.
- Correct path increments score.
- Wrong path records wrong answer.
- Test zone can launch it.
- CSS is scoped to `.sorter-*`.

## Suggested Commit

```bash
git add index.html js/core/game-registry.js js/games/sorter-belt.js css/games/sorter-belt.css
git commit -m "feat: add sorter belt game"
```

