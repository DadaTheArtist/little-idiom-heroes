# Task 04: Playable Challenge

## Goal

Add one real world-map challenge that uses `maze-runner`.

## Worker Context

The game should already be registered and functional. This task only wires content so it can be played from the normal UI.

## Files

- Modify `data/world-config.json`

## Required Change

In `zone-chinese-g3s2.challenges`, add a new challenge after `zg3s2-5`:

```json
{
  "id": "zg3s2-6",
  "name": "成語迷宮探險",
  "selectionMode": "fixed",
  "gameId": "maze-runner",
  "questionType": "choice",
  "answerMode": "tap-select",
  "content": "chinese/g3-s2.json",
  "questionCount": 10,
  "unlockRequire": "zg3s2-5"
}
```

## Acceptance Checks

- `python3 -m json.tool data/world-config.json` succeeds.
- 三下成語挑戰 shows `成語迷宮探險` after `成語太空射擊`.
- Level intro shows `迷宮探險`, icon `🧭`, and registry description.
- Starting the challenge loads the maze game.

## Suggested Commit

```bash
git add data/world-config.json
git commit -m "feat: add maze runner challenge"
```

