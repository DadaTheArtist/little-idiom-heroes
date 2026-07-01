# Task 05: Verification And Push

## Goal

Verify the completed batch, then push all local commits to `origin/main`.

## Required Checks

- `git status --short --branch`
- `python3 -m json.tool data/world-config.json`
- `node --check js/games/shield-defense.js`
- `node --check js/games/sorter-belt.js`
- Module import check for `shield-defense`, `sorter-belt`, `maze-runner`, and `GameRegistry`.
- Programmatic behavior checks for new games where browser automation is limited.
- Local static server smoke check.
- If browser automation is available, open Settings -> Game Test Zone and launch the new games.

## Push

After verification passes:

```bash
git push origin main
```

## Production QA

After push:

- Open production deployment.
- Go to Settings -> Game Test Zone.
- Launch `maze-runner`, `shield-defense`, and `sorter-belt`.
- Verify correct/wrong answer paths and return-to-test-zone flow.

## Acceptance Checks

- Local verification passes or limitations are explicitly recorded.
- Push succeeds.
- Production QA route exists and is usable.

