# Stillmind Sudoku prototype

A mobile-friendly browser prototype for a calm, Sudoku-first puzzle learning app.

## Open it

Open `index.html` in a modern browser. No build step or dependencies are required. The puzzle UI is designed for a phone-sized screen and can also be previewed on a desktop.

## What is included

- Home screen with daily puzzle entry point, streak, and personal progress summary.
- Sudoku board with Gentle, Steady, and Spicy puzzle choices.
- Number entry, notes, erase, and optional mistake highlighting.
- A tutorial you can take or skip, plus a board-aware lesson for a naked single or a truthful candidate scan.
- Progress stored in browser local storage on this device.
- A versioned, local-only rewards foundation with configurable reward rules.

## Prototype limits

This is currently a browser prototype, not an Android installation package. The puzzle choices use fixed example boards, and the teaching engine covers only basic candidate reasoning so far. Progress in browser storage does not transfer to a different browser or phone. A later Android app will need native packaging and a fresh-start skill check to support the intended phone-change flow.

The rewards data model, local date policy, and service methods are documented in [REWARDS_FOUNDATION.md](REWARDS_FOUNDATION.md). Daily claims, the wallet display, monthly loyalty rewards, Sudoku completion rewards, Collections, the Sticker Shop, and configurable surprise-box rewards are included. See [COLLECTIBLES_CATALOG.md](COLLECTIBLES_CATALOG.md) for adding designs, including box prizes.

## Project notes

See [GIT_AND_CODEX_CHEAT_SHEET.md](GIT_AND_CODEX_CHEAT_SHEET.md) for GitHub setup, saving checkpoints, and a Codex workflow.
