// Data-only starter catalog. Add items and artwork paths here; the Collections
// screen reads this catalog without requiring changes to its rendering logic.
window.StillmindCollectibleCatalog = {
  version: 1,
  categories: [
    { id: 'all', label: 'All Items' },
    { id: 'stickers', label: 'Stickers' },
    { id: 'special', label: 'Special Collectibles' },
    { id: 'monthly', label: 'Monthly Collections' },
    { id: 'boxRewards', label: 'Surprise Box Rewards' },
    { id: 'limitedEdition', label: 'Limited Edition' }
  ],
  items: [
    {
      id: 'first-week-sticker', name: 'First Week Star', description: 'A little celebration for showing up all week.',
      image: null, symbol: '✦', category: 'sticker', categories: ['stickers'], collection: 'Daily Beginnings', collectionId: 'daily-beginnings',
      month: null, event: null, rarity: 'special', currency: null, price: null, active: true, acquisition: 'reward-only',
      availableFrom: null, availableUntil: null, limitedEdition: false
    },
    {
      id: 'first-sudoku-complete', name: 'First Sudoku', description: 'Your first completed puzzle, kept as a little trophy.',
      image: null, symbol: '🧩', category: 'special', categories: ['special'], collection: 'Milestones', collectionId: 'milestones',
      month: null, event: 'first-game', rarity: 'rare', currency: null, price: null, active: true, acquisition: 'reward-only',
      availableFrom: null, availableUntil: null, limitedEdition: false
    },
    {
      id: 'monthly-commitment-sticker', name: 'Monthly Commitment', description: 'A keepsake for completing every day of a month.',
      image: null, symbol: '🌙', category: 'monthly', categories: ['monthly', 'special'], collection: 'Monthly Moments', collectionId: 'monthly-moments',
      month: null, event: 'monthly-full-month', rarity: 'special', currency: null, price: null, active: true, acquisition: 'reward-only',
      availableFrom: null, availableUntil: null, limitedEdition: false
    },
    {
      id: 'quiet-grove', name: 'Quiet Grove', description: 'A tiny green pause for your sticker album.',
      image: null, symbol: '🌿', category: 'sticker', categories: ['stickers'], collection: 'Little Pauses', collectionId: 'little-pauses',
      month: null, event: null, rarity: 'common', currency: 'coins', price: 60, active: true, acquisition: 'purchase',
      availableFrom: null, availableUntil: null, limitedEdition: false
    },
    {
      id: 'pocket-pause', name: 'Pocket Pause', description: 'A complimentary first sticker for your album.',
      image: null, symbol: '☀️', category: 'sticker', categories: ['stickers'], collection: 'Little Pauses', collectionId: 'little-pauses',
      month: null, event: null, rarity: 'common', currency: null, price: 0, active: true, acquisition: 'free',
      availableFrom: null, availableUntil: null, limitedEdition: false
    },
    {
      id: 'cloud-reader', name: 'Cloud Reader', description: 'A soft cloud for slow, thoughtful days.',
      image: null, symbol: '☁️', category: 'sticker', categories: ['stickers'], collection: 'Little Pauses', collectionId: 'little-pauses',
      month: null, event: null, rarity: 'common', currency: 'coins', price: 90, active: true, acquisition: 'purchase',
      availableFrom: null, availableUntil: null, limitedEdition: false
    },
    {
      id: 'moonlit-dragon', name: 'Moonlit Dragon', description: 'A gentle dragon keeping watch over your collection.',
      image: null, symbol: '🐉', category: 'special', categories: ['special'], collection: 'Night Garden', collectionId: 'night-garden',
      month: null, event: null, rarity: 'rare', currency: 'gems', price: 3, active: true, acquisition: 'purchase',
      availableFrom: null, availableUntil: null, limitedEdition: false
    },
    {
      id: 'autumn-window', name: 'Autumn Window', description: 'A limited leaf for the November collection.',
      image: null, symbol: '🍂', category: 'monthly', categories: ['monthly', 'limitedEdition'], collection: 'Autumn Windows', collectionId: 'autumn-2026',
      month: '2026-11', event: 'autumn-2026', rarity: 'limited', currency: 'gems', price: 2, active: true, acquisition: 'purchase',
      availableFrom: '2026-11-01', availableUntil: '2026-11-30', limitedEdition: true
    },
    {
      id: 'winter-wish', name: 'Winter Wish', description: 'A snowflake from the December winter collection.',
      image: null, symbol: '❄️', category: 'monthly', categories: ['monthly', 'limitedEdition'], collection: 'Winter Wishes', collectionId: 'winter-2026',
      month: '2026-12', event: 'winter-2026', rarity: 'limited', currency: 'gems', price: 3, active: true, acquisition: 'purchase',
      availableFrom: '2026-12-01', availableUntil: '2026-12-31', limitedEdition: true
    },
    {
      id: 'teacup-dragon', name: 'Tea-Time Dragon', description: 'A tiny dragon taking a cozy pause.',
      image: null, symbol: '🐲', category: 'sticker', categories: ['stickers', 'boxRewards'], collection: 'Little Surprises', collectionId: 'little-surprises',
      month: null, event: null, rarity: 'common', currency: null, price: null, active: true, acquisition: 'reward-only',
      availableFrom: null, availableUntil: null, limitedEdition: false
    },
    {
      id: 'night-sky-dragon', name: 'Night-Sky Dragon', description: 'A rare little dragon from a moonlit surprise.',
      image: null, symbol: '🐉', category: 'special', categories: ['special', 'boxRewards'], collection: 'Little Surprises', collectionId: 'little-surprises',
      month: null, event: null, rarity: 'rare', currency: null, price: null, active: true, acquisition: 'reward-only',
      availableFrom: null, availableUntil: null, limitedEdition: false
    }
  ]
};
