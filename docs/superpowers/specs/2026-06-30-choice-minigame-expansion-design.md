# Choice Minigame Expansion Design

Date: 2026-06-30
Project: Little Idiom Heroes
Status: proposed

## Goal

Add more variety to choice-question gameplay without changing the existing question data model. The first expansion should introduce medium-cost games that feel meaningfully different from the current tap, shooter, racing, matching, and board-selection games.

The target audience is Taiwan elementary grade 3-4 learners. The games should feel readable, forgiving, and playful on desktop and mobile.

## Current Context

The project is a pure ES6 static web game. Each game extends `BaseGame`, receives normalized `questions`, and reports results through `onComplete`.

Existing choice-compatible games include:

- `boss-fight`: drag or tap choice battle
- `racing`: answer to advance
- `match3`: find answer in a grid
- `connect`: pair question and answer
- `whack-a-mole`: wait for the right answer to appear
- `fishing`: select the right fish
- `memory-flip`: pair cards
- `balloon-pop`: tap moving answer balloons
- `space-shooter`: shoot answer asteroids

This creates strong coverage for fast selection and moving targets, but less coverage for exploration, defensive timing, and sorting-style interactions.

## Scope

Implement a planned set of three new `choice + tap-select` games:

1. `maze-runner`: Maze Adventure
2. `shield-defense`: Shield Defense
3. `sorter-belt`: Sorting Conveyor

The recommended implementation order is:

1. Maze Adventure
2. Shield Defense
3. Sorting Conveyor

The first implementation milestone may ship only Maze Adventure if we want to validate the pattern before adding the other two.

## Non-Goals

- No new question type.
- No new required fields in question JSON.
- No dependency on a build step or external game engine.
- No changes to textbook, zone, or progress storage models.
- No large asset pipeline. The games can use CSS, emoji, existing shared UI, and existing audio hooks.

## Shared Integration

Each new game should follow the existing game pattern:

- Add `js/games/<game-id>.js`.
- Add `css/games/<game-id>.css`.
- Import the CSS from `index.html`.
- Register the game in `js/core/game-registry.js`.
- Support `questionType: "choice"` and `answerMode: "tap-select"`.
- Use `q.hint || q.stem || q.prompt` for the displayed question.
- Use existing `q.options` when present, otherwise combine the answer with distractors.
- Bind the shared hint button via `BaseGame`.
- Record wrong answers with `_recordWrong(currentQuestion, pickedAnswer)` when a wrong choice advances or costs a life.
- Finish with `_finish()` so stars and wrong-answer review remain consistent.

All games should handle a back button the same way existing games do: destroy the game and call completion with zero stars.

## Game 1: Maze Adventure

Working ID: `maze-runner`

Display name: `迷宮探險`

Core fantasy: The hero explores a small maze and chooses the correct answer gate.

### Player Flow

For each question:

1. Show the current question above the board.
2. Render a compact maze with the hero near the bottom or center.
3. Place four answer gates around the maze.
4. The player moves the hero with on-screen directional buttons. Keyboard arrow keys may also work on desktop.
5. Reaching a gate submits that answer.
6. Correct answer opens the gate and advances to the next question.
7. Wrong answer shakes the gate, records the wrong answer, costs one heart, briefly highlights the correct gate, then advances.

### Rules

- Default lives: 3 hearts.
- Running out of hearts does not hard fail the level; it ends the game early and reports the score earned so far.
- Movement is grid-based, not physics-based.
- The maze should be generated from a small set of hand-authored layouts, not random maze generation, to keep mobile play readable.
- Answer labels must stay outside narrow walls where possible, using larger gate panels instead of tiny tiles.

### Why This Fits

This is the strongest first game because it gives the project a true adventure/exploration feel and avoids being another moving-target tap game. It also maps cleanly to existing `choice` data.

## Game 2: Shield Defense

Working ID: `shield-defense`

Display name: `盾牌防禦`

Core fantasy: Four answer enemies approach the castle. Choosing the right shield blocks the attack.

### Player Flow

For each question:

1. Show the current question in a top panel.
2. Spawn four enemy lanes, each labeled with one answer.
3. Enemies slowly approach the castle.
4. The player taps an answer lane or shield button.
5. Correct answer triggers a shield flash and pushes enemies back.
6. Wrong answer records the wrong answer, damages the castle, highlights the correct answer, then advances.
7. If time expires before a tap, treat it like a missed answer and advance.

### Rules

- Default castle health: 3 hearts.
- Enemy movement should be slow enough for grade 3-4 learners to read answer text.
- The game should support an untimed or generous timing mode by default. A challenge-level `timeLimitSeconds` may optionally speed up pressure later.
- When labels are long, lanes wrap text and enemies slow down rather than shrinking text aggressively.

### Why This Fits

It keeps the battle theme that works well in the project, but the mental model is defensive and lane-based instead of direct attack. It should be visually satisfying without needing new art assets.

## Game 3: Sorting Conveyor

Working ID: `sorter-belt`

Display name: `分類輸送帶`

Core fantasy: A question card arrives on a conveyor. The player sends it into the correct answer box.

### Player Flow

For each question:

1. Show a moving or centered question card.
2. Render four answer bins.
3. The player selects a bin. On pointer-capable devices, dragging the card into a bin can be supported as an enhancement, but tap-select must be the reliable baseline.
4. Correct answer drops the card into the bin and advances.
5. Wrong answer records the wrong answer, bumps the card out, highlights the correct bin, then advances.

### Rules

- The first version should use tap-select as the primary input to avoid mobile drag fragility.
- Optional drag support should not be required for completion.
- The conveyor should communicate sorting, but the card should not move so fast that text becomes hard to read.
- This game is best for science and math question sets with longer answer strings because it gives more stable reading time.

### Why This Fits

This adds a slower, categorization-like interaction that can support broader subjects. It is the highest-risk of the three because drag polish can expand scope, so it should ship after the first two unless tap-only is accepted.

## UX Requirements

- Mobile-first layout must fit within one viewport as much as possible.
- On-screen controls are required for Maze Adventure; keyboard controls are optional enhancement.
- Buttons and answer targets must be large enough for children using tablets.
- Text should wrap cleanly in answer panels.
- Feedback should be immediate and concrete: correct, wrong, correct answer reveal, score update.
- Use the shared hint button and existing wrong-answer review behavior.
- Use clear visual states for disabled, correct, wrong, and processing states.

## Data Flow

The new games consume normalized questions only:

- `id`
- `stem`
- `prompt`
- `hint`
- `answer`
- `options`
- `playerHint`

No new content files are needed for the initial rollout. Existing Chinese idiom, science, and math choice banks should work.

## Error Handling

- If fewer than four options are available, fill distractors through `BaseGame._getDistractors`.
- If labels duplicate, de-duplicate and refill from distractors where possible.
- If the game cannot build at least two choices, show a graceful in-game error and finish with current results.
- If DOM measurements are unavailable during initial render, fall back to fixed responsive CSS dimensions.

## Testing Strategy

For each implemented game:

- Manual smoke test with `python3 -m http.server 8000`.
- Verify one existing choice challenge can be temporarily pointed at the new `gameId`.
- Verify correct answer increments score and advances.
- Verify wrong answer records in wrong-answer review when applicable.
- Verify back button returns through the existing completion path.
- Verify mobile viewport layout does not overlap question text, answer labels, controls, and feedback.
- Verify hint button still opens the current question hint.

## Recommended Decision

Proceed with Maze Adventure first. It has the best balance of theme fit, gameplay difference, and implementation risk. After Maze Adventure is verified, add Shield Defense. Add Sorting Conveyor only after confirming tap-only sorting feels worthwhile or after allocating time for drag polish.

