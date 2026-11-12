# Stillmind Sudoku

A mobile-friendly Sudoku game that can be installed on Android as a Progressive Web App (PWA).

## Open it on a computer

Open `index.html` in a modern browser. No build step or dependencies are required. The puzzle UI is designed for a phone-sized screen and can also be previewed on a desktop. Offline installation requires the game to be served from an HTTPS website; opening the file directly does not enable installation or offline support.

## Install on Android

After this project is published at an HTTPS address, open that address in Chrome on the Android phone, open Chrome's menu, and choose **Install app** or **Add to Home screen**. Stillmind will then launch from a home-screen icon and cache its app files for offline use. Game progress and rewards remain stored on that device and are not synced to another phone.

This is an installable web app, not yet a Play Store listing or a standalone APK.

## What is included

- Home screen with daily puzzle entry point, streak, and personal progress summary.
- Sudoku board with Gentle, Steady, and Spicy puzzle choices.
- Number entry, notes, erase, and optional mistake highlighting.
- A tutorial you can take or skip, plus a board-aware lesson for a naked single or a truthful candidate scan.
- Progress stored in browser local storage on this device.
- A versioned, local-only rewards foundation with configurable reward rules.

## Current limits

The puzzle choices use fixed example boards, and the teaching engine covers only basic candidate reasoning so far. Progress in browser storage does not transfer to another phone. A later native Android app or account sync will be needed for a transferable phone-change flow.

The rewards data model, local date policy, and service methods are documented in [REWARDS_FOUNDATION.md](REWARDS_FOUNDATION.md). Daily claims, the wallet display, monthly loyalty rewards, Sudoku completion rewards, Collections, the Sticker Shop, and configurable surprise-box rewards are included. See [COLLECTIBLES_CATALOG.md](COLLECTIBLES_CATALOG.md) for adding designs, including box prizes.

## Project notes

See [GIT_AND_CODEX_CHEAT_SHEET.md](GIT_AND_CODEX_CHEAT_SHEET.md) for GitHub setup, saving checkpoints, and a Codex workflow.
