# Task 04: Docs And Cleanup

## Goal

Update docs for the new 15-game total and clean local `.DS_Store` noise before push.

## Files

- Modify `README.md`
- Modify `.gitignore`
- Remove untracked `.DS_Store`
- Remove untracked `css/.DS_Store`

## Required Behavior

- README says 15 games.
- README choice row includes `shield-defense` and `sorter-belt`.
- README game table includes both new games.
- README wrong-answer review connected list includes both new games.
- README maintenance/common tasks mention Settings -> Game Test Zone.
- `.gitignore` ignores `.DS_Store`.
- Working tree no longer shows `.DS_Store` files.

## Acceptance Checks

- `rg "13 種|13 個|12 種|12 個" README.md` finds nothing.
- `rg "15 種|15 個|shield-defense|sorter-belt|遊戲測試區" README.md` finds expected entries.
- `git status --short` does not show `.DS_Store`.

## Suggested Commit

```bash
git add README.md .gitignore
git commit -m "docs: document game test zone batch"
```

