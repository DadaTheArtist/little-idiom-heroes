# Game Test Zone And Minigames Design

Date: 2026-07-01
Project: Little Idiom Heroes
Status: approved for planning

## Goal

Finish the planned choice-game expansion and add a formal game testing area under Settings. The testing area must let us play every game type directly without changing player progress, unlock state, or the existing adventure flow.

## Scope

This batch includes:

1. Add `shield-defense`.
2. Add `sorter-belt`.
3. Add a Settings entry button for `遊戲測試區`.
4. Add a `GameTestScreen` that lists registered games and starts test runs.
5. Add an app-level `startGameTest(gameId)` path that uses real game classes and sample questions but never saves progress.
6. Update README game counts and references.
7. Push the completed batch to `main`.
8. QA through the production game testing area after push.

`maze-runner` is already implemented and should be included in the test zone.

## Non-Goals

- Do not change the normal `WorldMap -> LevelIntro -> Game -> Result` flow.
- Do not add new question types or required data fields.
- Do not make testing-area results unlock levels or write stars.
- Do not add a build step or external game framework.
- Do not redesign Settings beyond adding the testing area entry and supporting styles.

## Game Test Zone

Add a new screen, `GameTestScreen`, registered as `game-test` in `App`.

Settings gets a new button in the existing developer/maintenance area:

- Label: `🎮 遊戲測試區`
- Action: `screenManager.switchTo('game-test')`

The test zone lists every game from `GameRegistry.all()`. Each row shows:

- icon
- display name
- description
- supported question types
- supported answer modes
- a `開始測試` button

The screen should use existing app styling patterns: full-screen screen container, back button, simple list rows, no nested cards.

## Test Run Flow

Add `App.startGameTest(gameId)`.

This method:

1. Gets the game definition from `GameRegistry`.
2. Chooses a compatible sample challenge.
3. Builds a small in-memory sample content object.
4. Uses `ContentLoader.prepareQuestions()` so test runs exercise the same normalization path as real gameplay.
5. Dynamically imports the selected game module and starts the real game class.
6. On complete, switches to `result` with `levelConfig.isGameTest = true`.

Result behavior should treat `isGameTest` similarly to exam practice:

- no progress save
- retry returns to the same test game
- map/back action returns to `game-test`
- wrong-answer review still works when the game records wrong answers

## Sample Questions

The test zone uses in-memory sample content, not production textbook progress.

Supported sample sets:

- `choice`: 6 short questions with 4 options each.
- `true-false`: 6 O/X questions.
- `fill-blank`: 6 question-answer pairs for pair-select games.
- `multi-select`: 3 questions with `correctAnswers`.
- `ordering`: 3 questions with `correctOrder`.

For each game, choose the first supported question type and answer mode pair that can be built from the sample sets. If a game supports multiple modes, prefer its most common registered mode.

## Shield Defense

Game ID: `shield-defense`

Display name: `盾牌防禦`

Supported:

- `questionType: choice`
- `answerMode: tap-select`

Player flow:

1. Show the question.
2. Render four enemy lanes, each labeled with one answer.
3. Enemies approach slowly as visual pressure.
4. Player taps a lane/shield.
5. Correct answer flashes a shield, increments score, and advances.
6. Wrong answer records `_recordWrong`, reduces castle health, reveals the correct lane, and advances.
7. If health reaches 0, finish early with current score.

Implementation should favor readable labels and stable timing over fast arcade pressure.

## Sorting Conveyor

Game ID: `sorter-belt`

Display name: `分類輸送帶`

Supported:

- `questionType: choice`
- `answerMode: tap-select`

Player flow:

1. Show a question card.
2. Render four answer bins.
3. Player taps the bin that matches the correct answer.
4. Correct answer drops the card into the bin, increments score, and advances.
5. Wrong answer records `_recordWrong`, bumps the card, reveals the correct bin, and advances.

The first version is tap-first. Drag can be added later, but should not be required for QA or completion.

## Registry And Docs

Add both new games to `GameRegistry` and import their CSS from `index.html`.

README should update from 13 to 15 games and include:

- `shield-defense` in the choice row and game table.
- `sorter-belt` in the choice row and game table.
- Both games in the wrong-answer review connected list.
- The Settings game testing area in the maintenance section.

## Error Handling

- If a test game cannot be resolved, show a friendly error in the testing screen.
- If a game has no compatible sample question set, disable its test button and show `尚無測試題型`.
- If a game throws during dynamic import or init, show an error and return to the test zone.
- Normal gameplay errors should not be swallowed silently during local development; console errors are acceptable for debugging.

## Verification

Local verification:

- JSON checks for data files.
- Module import checks for new games and registry entries.
- Programmatic behavior checks for answer resolution and wrong-answer recording where browser automation is limited.
- Local static server smoke check.
- Manual or browser-based QA through Settings -> Game Test Zone when available.

Production verification:

1. Push the batch to `main`.
2. Open the production deployment.
3. Go to Settings -> Game Test Zone.
4. Launch each game at least once.
5. Verify new games can answer correct/wrong paths and return to the test zone.

## Commit And Push Strategy

Use focused local commits while implementing. After local verification passes, push all completed commits to `origin/main` in one push.

Before push:

- Remove or ignore `.DS_Store` files.
- Confirm `git status --short --branch` has no unintended tracked changes.
- Confirm `main` is ahead only by this planned batch and the prior approved maze-runner work.

