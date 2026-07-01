# Task 07: Final Verification

## Goal

Verify the integrated `maze-runner` feature and make only small fixes required by verification.

## Files

Verify or touch only if needed:

- `index.html`
- `js/core/game-registry.js`
- `js/games/maze-runner.js`
- `css/games/maze-runner.css`
- `data/world-config.json`
- `README.md`

## Required Checks

- `git status --short --branch`
- `python3 -m json.tool data/world-config.json`
- Serve with `python3 -m http.server 8000`
- Open the app and verify:
  - title screen loads
  - textbook select loads
  - 三下成語挑戰 loads
  - `成語迷宮探險` appears after the existing five challenges
  - intro shows `迷宮探險`
  - maze renders
  - correct gate increments score
  - wrong gate loses heart and records wrong answer
  - result screen appears when finished
  - wrong-answer review shows question, correct answer, and picked answer if any wrong answer occurred
- Mobile smoke test at about 390x844:
  - no overlap
  - controls tappable
  - answer gates readable

## Acceptance Checks

- All required checks pass or any limitation is explicitly reported.
- If fixes are needed, keep them narrowly scoped to the files above.
- Do not stage `.DS_Store`.

## Suggested Commit

Only if verification required fixes:

```bash
git add js/games/maze-runner.js css/games/maze-runner.css js/core/game-registry.js index.html data/world-config.json README.md
git commit -m "fix: polish maze runner verification issues"
```

