# Task 03: Answer Resolution

## Goal

Make answer gates resolve questions correctly, including score, hearts, wrong-answer tracking, correct-answer reveal, and completion.

## Worker Context

Task 02 should already render gates and move the hero. The game must follow `BaseGame` result behavior.

## Files

- Modify `js/games/maze-runner.js`
- Modify `css/games/maze-runner.css`

## Required Behavior

- When the hero reaches a gate, compare the gate answer with the current question answer.
- Correct answer:
  - increments `correctCount`
  - updates score
  - marks the selected gate correct
  - advances after a short delay
- Wrong answer:
  - decrements lives, minimum 0
  - calls `_recordWrong(q, pickedAnswer)`
  - updates hearts
  - marks the picked gate wrong
  - highlights the correct gate
  - advances after a longer delay
- Reaching the end of the question list calls `_finish()`.
- Reaching 0 hearts ends the game early with the current score.
- Processing state must prevent double submits.
- Feedback must appear briefly and clear itself.
- `destroy()` must clear feedback timers and remove listeners.

## Acceptance Checks

- Correct gate increments score and advances.
- Wrong gate loses one heart and advances.
- Correct gate is revealed on wrong answer.
- Wrong answers appear in result review data through existing `_recordWrong`.
- Hint button still shows current `playerHint`.
- Back button completes with zero stars and current wrong answers.

## Suggested Commit

```bash
git add js/games/maze-runner.js css/games/maze-runner.css
git commit -m "feat: resolve maze runner answers"
```

