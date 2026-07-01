# Task 02: Shield Defense Game

## Goal

Add the `shield-defense` choice minigame.

## Files

- Create `js/games/shield-defense.js`
- Create `css/games/shield-defense.css`
- Modify `js/core/game-registry.js`
- Modify `index.html`

## Required Behavior

- Default export a `ShieldDefense` class extending `BaseGame`.
- Supports `questionType: choice` and `answerMode: tap-select`.
- Render HUD with back button, progress, score, castle hearts, hint button.
- Render current question and four enemy lanes labeled with answers.
- Tapping a lane submits that answer.
- Correct answer increments score, marks selected lane correct, and advances.
- Wrong answer decrements castle health, calls `_recordWrong(q, pickedAnswer)`, marks wrong lane, reveals correct lane, and advances.
- 0 health finishes early with current score.
- Back button completes with zero stars and current wrong answers.
- Clean up timers/listeners in `destroy()`.

## Acceptance Checks

- Module imports without errors.
- Registry returns `shield-defense`.
- Correct path increments score.
- Wrong path records wrong answer.
- Test zone can launch it.
- CSS is scoped to `.shield-*`.

## Suggested Commit

```bash
git add index.html js/core/game-registry.js js/games/shield-defense.js css/games/shield-defense.css
git commit -m "feat: add shield defense game"
```

