# Task 06: Documentation

## Goal

Update README so the documented game list and choice-game references include `maze-runner`.

## Files

- Modify `README.md`

## Required Changes

- Update the top-level description from 12 games to 13 games.
- In the question type reference table, add `maze-runner` to the `choice` row.
- In the game list table, add:

```md
| `maze-runner` | 🧭 迷宮探險 | 方向控制 | choice |
```

- If any nearby prose says `12 個遊戲皆位於 js/games/`, update it to 13.

## Acceptance Checks

- README no longer says 12 games for the current game count.
- `maze-runner` appears in both the choice row and game list.
- No unrelated README rewrite.

## Suggested Commit

```bash
git add README.md
git commit -m "docs: document maze runner game"
```

