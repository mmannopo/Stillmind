// Data-only reward configuration. Adjust values and reward contents here
// without changing the reward engine in rewards.js.
window.StillmindRewardConfig = {
  schemaVersion: 1,
  calendar: {
    timezoneStrategy: 'device-local',
    dayBoundary: 'local-midnight'
  },
  dailyCycle: [
    { type: 'currency', currency: 'coins', amount: 25, label: '25 coins' },
    { type: 'currency', currency: 'gems', amount: 1, label: '1 gem' },
    { type: 'surpriseBox', boxType: 'daily', label: 'A surprise box' },
    { type: 'currency', currency: 'coins', amount: 40, label: '40 coins' },
    { type: 'currency', currency: 'gems', amount: 2, label: '2 gems' },
    { type: 'surpriseBox', boxType: 'daily', label: 'A surprise box' },
    {
      type: 'collectible',
      item: {
        id: 'first-week-sticker',
        name: 'First Week Star',
        category: 'sticker',
        collection: 'Daily Beginnings',
        rarity: 'special'
      },
      duplicateReward: { type: 'currency', currency: 'coins', amount: 100 },
      label: 'A special sticker'
    }
  ],
  monthlyRewards: {
    fifteenDays: { type: 'currency', currency: 'gems', amount: 10, label: '10 gems' },
    fullMonth: {
      type: 'collectible',
      item: {
        id: 'monthly-commitment-sticker',
        name: 'Monthly Commitment',
        category: 'monthly',
        collection: 'Monthly Moments',
        rarity: 'special'
      },
      duplicateReward: { type: 'currency', currency: 'gems', amount: 5 },
      label: 'A monthly collectible'
    }
  },
  surpriseBoxPools: {
    default: [
      { weight: 40, label: 'A little coin bundle', reward: { type: 'currency', currency: 'coins', amount: 20 } },
      { weight: 25, label: 'A gem to keep', reward: { type: 'currency', currency: 'gems', amount: 1 } },
      { weight: 20, label: 'A small sticker surprise', reward: { type: 'collectible', itemId: 'teacup-dragon', duplicateReward: { type: 'currency', currency: 'coins', amount: 35 } } },
      { weight: 10, label: 'A cozy little bundle', reward: { type: 'bundle', rewards: [{ type: 'currency', currency: 'coins', amount: 15 }, { type: 'collectible', itemId: 'teacup-dragon', duplicateReward: { type: 'currency', currency: 'coins', amount: 35 } }] } },
      { weight: 5, label: 'A rare night-sky sticker', reward: { type: 'collectible', itemId: 'night-sky-dragon', duplicateReward: { type: 'currency', currency: 'gems', amount: 2 } } }
    ],
    daily: [
      { weight: 40, label: 'A little coin bundle', reward: { type: 'currency', currency: 'coins', amount: 20 } },
      { weight: 25, label: 'A gem to keep', reward: { type: 'currency', currency: 'gems', amount: 1 } },
      { weight: 20, label: 'A small sticker surprise', reward: { type: 'collectible', itemId: 'teacup-dragon', duplicateReward: { type: 'currency', currency: 'coins', amount: 35 } } },
      { weight: 10, label: 'A cozy little bundle', reward: { type: 'bundle', rewards: [{ type: 'currency', currency: 'coins', amount: 15 }, { type: 'collectible', itemId: 'teacup-dragon', duplicateReward: { type: 'currency', currency: 'coins', amount: 35 } }] } },
      { weight: 5, label: 'A rare night-sky sticker', reward: { type: 'collectible', itemId: 'night-sky-dragon', duplicateReward: { type: 'currency', currency: 'gems', amount: 2 } } }
    ],
    'game-milestone': [
      { weight: 30, label: 'A bigger coin bundle', reward: { type: 'currency', currency: 'coins', amount: 45 } },
      { weight: 25, label: 'Two gems to keep', reward: { type: 'currency', currency: 'gems', amount: 2 } },
      { weight: 25, label: 'A small sticker surprise', reward: { type: 'collectible', itemId: 'teacup-dragon', duplicateReward: { type: 'currency', currency: 'coins', amount: 35 } } },
      { weight: 10, label: 'A cozy little bundle', reward: { type: 'bundle', rewards: [{ type: 'currency', currency: 'coins', amount: 30 }, { type: 'collectible', itemId: 'teacup-dragon', duplicateReward: { type: 'currency', currency: 'coins', amount: 35 } }] } },
      { weight: 15, label: 'A rare night-sky sticker', reward: { type: 'collectible', itemId: 'night-sky-dragon', duplicateReward: { type: 'currency', currency: 'gems', amount: 2 } } }
    ]
  },
  gameRewards: {
    completion: { type: 'currency', currency: 'coins', amount: 20, label: '20 coins' },
    byDifficulty: {
      Beginner: { type: 'currency', currency: 'coins', amount: 0 },
      Easy: { type: 'currency', currency: 'coins', amount: 5 },
      Medium: { type: 'currency', currency: 'coins', amount: 10 },
      Hard: { type: 'currency', currency: 'coins', amount: 15 },
      Expert: { type: 'currency', currency: 'coins', amount: 20 }
    },
    firstGameBonus: {
      type: 'bundle',
      rewards: [
        { type: 'currency', currency: 'gems', amount: 3 },
        {
          type: 'collectible',
          item: {
            id: 'first-sudoku-complete',
            name: 'First Sudoku',
            category: 'special',
            collection: 'Milestones',
            rarity: 'rare'
          }
        }
      ],
      label: 'First game bonus'
    },
    milestones: {
      5: { type: 'surpriseBox', boxType: 'game-milestone', label: 'Five-game surprise box' },
      10: { type: 'currency', currency: 'gems', amount: 5, label: 'Ten-game gem reward' }
    }
  }
};
