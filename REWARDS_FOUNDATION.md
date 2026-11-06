# Rewards foundation

The local reward layer connects daily claims to app startup, displays the
wallet and monthly milestones, and awards validated Sudoku completions through
the existing `finishGame()` path. Collections, the sticker shop, and opening
configurable surprise boxes are included.

## Files

- `rewards-config.js` contains editable reward amounts, the seven-day reward
  cycle, monthly milestone rewards, Sudoku completion rewards, and weighted
  surprise-box prize pools.
- `rewards.js` owns the versioned local reward record and exposes
  `window.StillmindRewards` to the game and collection screens.
- `index.html` loads the config, reward service, then the existing `app.js`.

## Storage and dates

The reward service stores one JSON record at `stillmindRewardsV1`. A reward
operation updates a draft and writes the complete record once; in-memory state
is published only after that write succeeds. Transactions include an ID,
timestamp, source, currency changes, acquired item IDs, and granted box IDs.
Daily and game operations use stable IDs to reject duplicate claims.

Reward days use the device's local calendar and local midnight. Consecutive
streak length is separate from lifetime distinct active days. The reward cycle
repeats after Day 7 while an uninterrupted streak keeps counting; a missed day
resets the streak. Changing the device timezone or clock can affect a local-only
record. Local storage is neither secure nor synced to another device.

## Public API

- `getSnapshot()` returns a copy of the current record.
- `getConfig()` returns a copy of the reward configuration.
- `subscribe(callback)` watches saved balance and reward-record changes.
- `claimDailyReward(date)` records one daily claim, updates streak and monthly
  active dates, and grants the configured reward.
- `claimMonthlyMilestone(name, month, claimedAt)` claims `fifteenDays` or
  `fullMonth` once when that month's active-day record qualifies. `month` may
  be a `Date` or a `YYYY-MM` key, so past unlocked milestones stay claimable.
- `recordGameCompletion(gameId, difficulty, date)` awards completion and
  first-game rewards once per game ID.
- `preserveLegacyGameHistory(completedCount)` prevents an existing player from
  receiving the first-game bonus again when their older Sudoku totals show a
  completion from before the rewards feature.
- `spendCurrency(currency, amount, transactionId, source, description, date)`
  prevents invalid, duplicate, or unaffordable spends.
- `purchaseCollectible(item, currency, amount, purchaseId, date)` atomically
  checks ownership and balance, deducts currency, records the purchase, and
  adds the collectible.
- `openSurpriseBox(boxId, date)` selects a weighted prize from the pool matching
  the box type (or `default`), grants it, records the reveal, and marks the box
  opened in one local transaction. Reopening the same box is rejected.

Surprise box prizes use `{ weight, label, reward }` entries in
`StillmindRewardConfig.surpriseBoxPools`. Weights are relative probabilities;
they do not have to add up to 100. A collectible prize references an item ID in
`collectibles-catalog.js`; optional `duplicateReward` gives a consolation
reward if that item is already owned.

The daily claim is automatically checked on each app open. A reward is recorded
only once per local calendar date; the acknowledgement dialog appears only for
a newly recorded claim. Sudoku rewards use a persisted game-session ID, so
retries cannot reward the same session twice.
