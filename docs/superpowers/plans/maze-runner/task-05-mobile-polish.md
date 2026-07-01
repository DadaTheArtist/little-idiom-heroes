# Task 05: Mobile Polish

## Goal

Make `maze-runner` comfortable on phone-sized viewports and add small accessibility labels.

## Worker Context

Do not redesign the game. Keep the existing layout, tune dimensions, wrapping, and controls.

## Files

- Modify `js/games/maze-runner.js`
- Modify `css/games/maze-runner.css`

## Required Behavior

- At around 390x844:
  - header remains readable
  - question wraps without overlap
  - maze stays square
  - directional controls remain visible
  - gate labels remain readable
  - feedback does not permanently cover controls or gates
- Add aria labels for:
  - answer gates, format `答案門：<answer>`
  - hero position, `勇者位置`
- Buttons must remain large enough for touch.
- Text must wrap rather than overflow answer gates.

## Acceptance Checks

- Manual browser dev tools check at 390x844 passes.
- Manual desktop viewport still looks reasonable.
- No text overlap in question, gates, feedback, or controls.

## Suggested Commit

```bash
git add js/games/maze-runner.js css/games/maze-runner.css
git commit -m "style: polish maze runner layout"
```

