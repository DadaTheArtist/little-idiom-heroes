# Maze Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan task-by-task. Do not send this whole index to workers when a task card is enough.

**Goal:** Add `maze-runner`, a `choice + tap-select` maze minigame where the player moves a hero to the correct answer gate.

**Architecture:** Keep the feature isolated: one new game class, one new stylesheet, one registry entry, one CSS import, one playable challenge, README updates, then manual verification.

**Tech Stack:** Vanilla ES6 modules, existing `BaseGame`, static CSS, existing `GameRegistry`, existing `world-config.json`.

---

## Execution Policy

This plan is intentionally split to reduce token waste in fresh workers. The controller should read this index, then dispatch workers using only the current task card plus a very small project context paragraph.

Do not ask workers to read the old monolithic plan or every task card.

## Task Cards

1. [Task 01: Game Shell](maze-runner/task-01-shell.md)
2. [Task 02: Maze Movement](maze-runner/task-02-movement.md)
3. [Task 03: Answer Resolution](maze-runner/task-03-answer-resolution.md)
4. [Task 04: Playable Challenge](maze-runner/task-04-playable-challenge.md)
5. [Task 05: Mobile Polish](maze-runner/task-05-mobile-polish.md)
6. [Task 06: Documentation](maze-runner/task-06-documentation.md)
7. [Task 07: Final Verification](maze-runner/task-07-final-verification.md)

## Shared Context For All Workers

- Project root: `/Users/dada/Documents/little-idiom-heroes`
- App style: no build step, vanilla ES6 modules, static files.
- Existing games live in `js/games/` and extend `BaseGame`.
- CSS is manually imported from `index.html`.
- Games are registered in `js/core/game-registry.js`.
- Challenge data lives in `data/world-config.json`.
- Do not stage or commit `.DS_Store`.
- Do not revert unrelated user changes.

## Milestone Order

Run tasks sequentially. Each task has a disjoint or mostly narrow write set, but later tasks depend on earlier files existing.

The only exception is Task 07, which verifies the integrated result and may make small fixes across the touched files.

