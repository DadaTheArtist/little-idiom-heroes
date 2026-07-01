# Game Test Zone Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Settings game testing area, finish `shield-defense` and `sorter-belt`, verify locally, and push the completed batch to `main`.

**Architecture:** Keep testing separate from adventure progress by adding a `GameTestScreen` and `App.startGameTest(gameId)`. Add each new minigame as its own `BaseGame` subclass and stylesheet, then register both through the existing `GameRegistry` and static CSS imports.

**Tech Stack:** Vanilla ES6 modules, DOM APIs, static CSS, existing `BaseGame`, `GameRegistry`, `ContentLoader`, and `ScreenManager`.

---

## Execution Policy

This index is intentionally short. Dispatch or execute one task card at a time; do not make workers read every card.

## Task Cards

1. [Task 01: Game Test Zone Infrastructure](game-test-zone-batch/task-01-game-test-zone.md)
2. [Task 02: Shield Defense Game](game-test-zone-batch/task-02-shield-defense.md)
3. [Task 03: Sorter Belt Game](game-test-zone-batch/task-03-sorter-belt.md)
4. [Task 04: Docs And Cleanup](game-test-zone-batch/task-04-docs-cleanup.md)
5. [Task 05: Verification And Push](game-test-zone-batch/task-05-verify-push.md)

## Shared Context

- Project root: `/Users/dada/Documents/little-idiom-heroes`
- No build step; app runs from static files.
- Existing games live in `js/games/` and extend `BaseGame`.
- CSS is imported manually from `index.html`.
- Settings screen is `js/screens/settings-screen.js`.
- Result behavior is `js/screens/result-screen.js`.
- Do not stage `.DS_Store` unless explicitly removing it or ignoring it.
- Do not revert unrelated user changes.

