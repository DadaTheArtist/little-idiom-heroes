# Task 01: Game Test Zone Infrastructure

## Goal

Add a Settings entry and a `GameTestScreen` that can launch registered games in a no-progress test mode.

## Files

- Create `js/screens/game-test-screen.js`
- Create `css/game-test.css`
- Modify `js/app.js`
- Modify `js/screens/settings-screen.js`
- Modify `js/screens/result-screen.js`
- Modify `index.html`

## Required Behavior

- Settings shows a `🎮 遊戲測試區` button near `題目校對`.
- `GameTestScreen` lists `this.app.gameRegistry.all()` with icon, name, description, supported question types, supported answer modes, and `開始測試`.
- `App.startGameTest(gameId)` resolves the game, builds sample questions, imports the real game class, and starts it.
- Test runs use `ContentLoader.prepareQuestions()` against in-memory sample content.
- Test runs do not call `progress.completeLevel`.
- Result screen recognizes `levelConfig.isGameTest`.
- In test mode, retry starts the same test game and back/map returns to `game-test`.
- Wrong-answer review still works.

## Sample Question Sets

- `choice`: 6 short four-option questions.
- `true-false`: 6 O/X questions.
- `fill-blank`: 6 pairable answer questions.
- `multi-select`: 3 questions with `correctAnswers`.
- `ordering`: 3 questions with `correctOrder`.

## Acceptance Checks

- `GameTestScreen` is registered as `game-test`.
- Settings button navigates to `game-test`.
- Every registered game renders a row.
- At least `boss-fight`, `maze-runner`, and one non-choice game can be started from the test zone.
- No test run changes progress.

## Suggested Commit

```bash
git add index.html css/game-test.css js/app.js js/screens/settings-screen.js js/screens/result-screen.js js/screens/game-test-screen.js
git commit -m "feat: add game test zone"
```

