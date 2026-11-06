// Local-only rewards foundation. UI code should use this API instead of
// reading or modifying the reward record directly.
(() => {
  const STORAGE_KEY = 'stillmindRewardsV1';
  const config = window.StillmindRewardConfig;
  const subscribers = new Set();
  const localProfileId = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  const makeEmptyRecord = () => ({
    schemaVersion: 1,
    profileId: localProfileId,
    currencies: { coins: 0, gems: 0 },
    daily: { currentStreak: 0, totalActiveDays: 0, lastClaimDate: null, activeDates: [], claimsByDate: {} },
    monthly: {},
    firstGameBonusClaimed: false,
    legacyCompletedGames: 0,
    completedGameIds: [],
    ownedItems: [],
    boxes: [],
    transactions: []
  });

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function normalizeRecord(value) {
    const empty = makeEmptyRecord();
    if (!value || value.schemaVersion !== 1 || typeof value !== 'object') return empty;
    const daily = { ...empty.daily, ...(value.daily || {}) };
    daily.activeDates = Array.isArray(daily.activeDates) ? daily.activeDates : [];
    daily.claimsByDate = daily.claimsByDate && typeof daily.claimsByDate === 'object' ? daily.claimsByDate : {};
    daily.totalActiveDays = daily.activeDates.length;
    return {
      ...empty,
      ...value,
      profileId: typeof value.profileId === 'string' && value.profileId ? value.profileId : localProfileId,
      currencies: { ...empty.currencies, ...(value.currencies || {}) },
      daily,
      monthly: value.monthly && typeof value.monthly === 'object' ? value.monthly : {},
      completedGameIds: Array.isArray(value.completedGameIds) ? value.completedGameIds : [],
      ownedItems: Array.isArray(value.ownedItems) ? value.ownedItems : [],
      boxes: Array.isArray(value.boxes) ? value.boxes : [],
      transactions: Array.isArray(value.transactions) ? value.transactions : []
    };
  }

  function loadRecord() {
    try { return normalizeRecord(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); }
    catch (error) { console.warn('Could not read Stillmind rewards from this device.', error); return makeEmptyRecord(); }
  }

  let record = loadRecord();
  function snapshot() { return clone(record); }

  function emitSnapshot() {
    subscribers.forEach((subscriber) => {
      try { subscriber(snapshot()); }
      catch (error) { console.warn('A Stillmind rewards listener could not update.', error); }
    });
  }

  function publish(next) {
    // One write commits each reward operation together. Publish in memory only
    // after storage accepts it, so a failed save never grants phantom rewards.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    record = next;
    emitSnapshot();
    return snapshot();
  }

  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function ordinal(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  }
  function monthKey(dateKey) { return dateKey.slice(0, 7); }

  function makeTransaction(id, source, description, date, before, after, details = {}) {
    const currencyChanges = {};
    ['coins', 'gems'].forEach((currency) => {
      const change = (after.currencies[currency] || 0) - (before.currencies[currency] || 0);
      if (change) currencyChanges[currency] = change;
    });
    const items = after.ownedItems.filter((item) => !before.ownedItems.some((old) => old.transactionId === item.transactionId));
    const boxes = after.boxes.filter((box) => !before.boxes.some((old) => old.id === box.id));
    return {
      id, source, description, timestamp: date.toISOString(), currencyChanges,
      itemsAcquired: items.map((item) => item.itemId), boxesGranted: boxes.map((box) => box.id), ...details
    };
  }

  function addReward(draft, reward, source, date, transactionId) {
    if (!reward || typeof reward !== 'object') return;
    if (reward.type === 'bundle') {
      (reward.rewards || []).forEach((part, index) => addReward(draft, part, source, date, `${transactionId}:${index + 1}`));
      return;
    }
    if (reward.type === 'currency') {
      const amount = Math.floor(Number(reward.amount));
      if (!['coins', 'gems'].includes(reward.currency) || !Number.isFinite(amount) || amount <= 0) return;
      draft.currencies[reward.currency] = Math.max(0, Number(draft.currencies[reward.currency]) || 0) + amount;
      return;
    }
    if (reward.type === 'surpriseBox') {
      const id = `${transactionId}:box`;
      if (!draft.boxes.some((box) => box.id === id)) draft.boxes.push({ id, boxType: reward.boxType || 'standard', acquiredAt: date.toISOString(), source, openedAt: null });
      return;
    }
    if (reward.type === 'collectible' && reward.item?.id) {
      if (draft.ownedItems.some((owned) => owned.itemId === reward.item.id)) {
        if (reward.duplicateReward) addReward(draft, reward.duplicateReward, source, date, `${transactionId}:duplicate`);
        return;
      }
      draft.ownedItems.push({
        itemId: reward.item.id,
        name: reward.item.name || reward.item.id,
        description: reward.item.description || '',
        category: reward.item.category || 'collectible',
        categories: Array.isArray(reward.item.categories) ? reward.item.categories.slice() : [reward.item.category || 'collectible'],
        collection: reward.item.collection || null,
        collectionId: reward.item.collectionId || null,
        month: reward.item.month || null,
        event: reward.item.event || null,
        rarity: reward.item.rarity || 'common',
        image: reward.item.image || null,
        symbol: reward.item.symbol || null,
        limitedEdition: Boolean(reward.item.limitedEdition),
        acquiredAt: date.toISOString(),
        source,
        transactionId
      });
    }
  }

  function commit(id, source, description, date, mutate) {
    if (record.transactions.some((transaction) => transaction.id === id)) return { applied: false, reason: 'duplicate', record: snapshot() };
    const draft = clone(record);
    const details = mutate(draft) || {};
    draft.transactions.push(makeTransaction(id, source, description, date, record, draft, details));
    try { return { applied: true, record: publish(draft) }; }
    catch (error) { console.warn('Could not save a Stillmind reward transaction.', error); return { applied: false, reason: 'storage-error', error, record: snapshot() }; }
  }

  function claimDailyReward(date = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return { applied: false, reason: 'invalid-date', record: snapshot() };
    const key = localDateKey(date);
    const prior = record.daily.claimsByDate[key];
    if (prior) return { applied: false, reason: 'already-claimed', claim: clone(prior), record: snapshot() };
    const lastDate = record.daily.lastClaimDate;
    if (lastDate && ordinal(key) < ordinal(lastDate)) return { applied: false, reason: 'date-before-last-claim', record: snapshot() };
    const cycle = config.dailyCycle || [];
    if (!cycle.length) return { applied: false, reason: 'missing-daily-cycle', record: snapshot() };
    const daysBetween = lastDate ? ordinal(key) - ordinal(lastDate) : null;
    const streak = !lastDate ? 1 : daysBetween === 1 ? record.daily.currentStreak + 1 : daysBetween === 0 ? record.daily.currentStreak : 1;
    const cycleDay = ((streak - 1) % cycle.length) + 1;
    const reward = clone(cycle[cycleDay - 1]);
    const month = monthKey(key);
    const id = `daily:${key}`;
    const result = commit(id, 'daily-reward', reward.label || `Day ${cycleDay} reward`, date, (draft) => {
      draft.daily.currentStreak = streak;
      draft.daily.lastClaimDate = key;
      draft.daily.activeDates.push(key);
      draft.daily.totalActiveDays = draft.daily.activeDates.length;
      draft.daily.claimsByDate[key] = { date: key, streak, cycleDay, claimedAt: date.toISOString(), reward };
      if (!draft.monthly[month]) draft.monthly[month] = { activeDates: [], milestoneClaims: {} };
      if (!draft.monthly[month].activeDates.includes(key)) draft.monthly[month].activeDates.push(key);
      addReward(draft, reward, 'daily-reward', date, id);
      return { activeDate: key, streak, totalActiveDays: draft.daily.totalActiveDays, cycleDay, reward };
    });
    return { ...result, claim: result.applied ? clone(result.record.daily.claimsByDate[key]) : null };
  }

  function claimMonthlyMilestone(milestone, month = new Date(), claimedAt = new Date()) {
    if (!(claimedAt instanceof Date) || Number.isNaN(claimedAt.getTime())) return { applied: false, reason: 'invalid-date', record: snapshot() };
    const key = month instanceof Date ? monthKey(localDateKey(month)) : String(month);
    if (!/^\d{4}-\d{2}$/.test(key) || Number(key.slice(5)) < 1 || Number(key.slice(5)) > 12) return { applied: false, reason: 'invalid-month', record: snapshot() };
    const monthRecord = record.monthly[key];
    const activeDays = monthRecord?.activeDates?.length || 0;
    const [year, monthNumber] = key.split('-').map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const eligible = milestone === 'fifteenDays' ? activeDays >= 15 : milestone === 'fullMonth' && activeDays === daysInMonth;
    if (!eligible) return { applied: false, reason: 'not-earned', record: snapshot() };
    if (monthRecord.milestoneClaims?.[milestone]) return { applied: false, reason: 'already-claimed', record: snapshot() };
    const reward = config.monthlyRewards?.[milestone];
    if (!reward) return { applied: false, reason: 'missing-monthly-reward', record: snapshot() };
    const id = `monthly:${key}:${milestone}`;
    return commit(id, 'monthly-milestone', reward.label || milestone, claimedAt, (draft) => {
      draft.monthly[key].milestoneClaims[milestone] = { claimedAt: claimedAt.toISOString(), reward };
      addReward(draft, reward, 'monthly-milestone', claimedAt, id);
      return { month: key, milestone, activeDays, reward };
    });
  }

  function recordGameCompletion(gameId, difficulty = 'Beginner', date = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return { applied: false, reason: 'invalid-date', record: snapshot() };
    if (!gameId) return { applied: false, reason: 'missing-game-id', record: snapshot() };
    if (record.completedGameIds.includes(gameId)) return { applied: false, reason: 'already-rewarded', record: snapshot() };
    const id = `game:${gameId}`;
    const rewards = config.gameRewards;
    return commit(id, 'game-completion', `Completed ${difficulty} Sudoku`, date, (draft) => {
      draft.completedGameIds.push(gameId);
      addReward(draft, rewards.completion, 'game-completion', date, `${id}:base`);
      const difficultyReward = rewards.byDifficulty?.[difficulty];
      if (difficultyReward) addReward(draft, difficultyReward, 'game-completion', date, `${id}:difficulty`);
      const firstGameBonus = !draft.firstGameBonusClaimed;
      if (firstGameBonus) {
        draft.firstGameBonusClaimed = true;
        addReward(draft, rewards.firstGameBonus, 'first-game-bonus', date, `${id}:first`);
      }
      const totalCompletedGames = draft.legacyCompletedGames + draft.completedGameIds.length;
      const milestoneReward = rewards.milestones?.[totalCompletedGames];
      if (milestoneReward) addReward(draft, milestoneReward, 'game-milestone', date, `${id}:milestone:${totalCompletedGames}`);
      return { gameId, difficulty, firstGameBonus, totalCompletedGames, milestoneReward: milestoneReward || null };
    });
  }

  function preserveLegacyGameHistory(completedCount) {
    const count = Math.floor(Number(completedCount));
    if (!Number.isFinite(count) || count <= 0 || record.firstGameBonusClaimed) return { applied: false, reason: 'not-needed', record: snapshot() };
    return commit('migration:legacy-completed-games', 'migration', `Preserved ${count} earlier Sudoku completions`, new Date(), (draft) => {
      draft.firstGameBonusClaimed = true;
      draft.legacyCompletedGames = count;
      return { completedBeforeRewards: count };
    });
  }

  function spendCurrency(currency, amount, transactionId, source, description, date = new Date()) {
    const value = Math.floor(Number(amount));
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return { applied: false, reason: 'invalid-date', record: snapshot() };
    if (!transactionId) return { applied: false, reason: 'missing-transaction-id', record: snapshot() };
    if (!['coins', 'gems'].includes(currency) || !Number.isFinite(value) || value <= 0) return { applied: false, reason: 'invalid-cost', record: snapshot() };
    if (record.currencies[currency] < value) return { applied: false, reason: 'insufficient-funds', record: snapshot() };
    return commit(transactionId, source || 'purchase', description || `Spent ${value} ${currency}`, date, (draft) => {
      draft.currencies[currency] -= value;
      return { currency, amount: value };
    });
  }

  function getCatalogItem(itemId) {
    return window.StillmindCollectibleCatalog?.items?.find((entry) => entry.id === itemId) || null;
  }

  function isCatalogItemAvailable(item, acquisition, date) {
    const catalogItem = getCatalogItem(item?.id);
    if (!catalogItem || catalogItem.active === false || catalogItem.acquisition !== acquisition) return false;
    const today = localDateKey(date);
    return (!catalogItem.availableFrom || today >= catalogItem.availableFrom)
      && (!catalogItem.availableUntil || today <= catalogItem.availableUntil);
  }

  function purchaseCollectible(item, currency, amount, purchaseId, date = new Date()) {
    const price = Math.floor(Number(amount));
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return { applied: false, reason: 'invalid-date', record: snapshot() };
    if (!purchaseId || !item?.id) return { applied: false, reason: 'missing-id', record: snapshot() };
    if (!['coins', 'gems'].includes(currency) || !Number.isFinite(price) || price <= 0) return { applied: false, reason: 'invalid-cost', record: snapshot() };
    const catalogItem = getCatalogItem(item.id);
    if (!isCatalogItemAvailable(item, 'purchase', date)) return { applied: false, reason: 'not-available', record: snapshot() };
    if (catalogItem.currency !== currency || Number(catalogItem.price) !== price) return { applied: false, reason: 'catalog-price-mismatch', record: snapshot() };
    if (record.transactions.some((transaction) => transaction.id === `purchase:${purchaseId}`)) return { applied: false, reason: 'duplicate', record: snapshot() };
    if (record.ownedItems.some((owned) => owned.itemId === item.id)) return { applied: false, reason: 'already-owned', record: snapshot() };
    if (record.currencies[currency] < price) return { applied: false, reason: 'insufficient-funds', record: snapshot() };
    const id = `purchase:${purchaseId}`;
    return commit(id, 'shop-purchase', `Purchased ${item.name || item.id}`, date, (draft) => {
      draft.currencies[currency] -= price;
      addReward(draft, { type: 'collectible', item }, 'shop-purchase', date, id);
      return { itemId: item.id, currency, amount: price, collection: item.collection || null };
    });
  }

  function claimFreeCollectible(item, claimId, date = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return { applied: false, reason: 'invalid-date', record: snapshot() };
    if (!claimId || !item?.id) return { applied: false, reason: 'missing-id', record: snapshot() };
    if (!isCatalogItemAvailable(item, 'free', date)) return { applied: false, reason: 'not-available', record: snapshot() };
    if (record.ownedItems.some((owned) => owned.itemId === item.id)) return { applied: false, reason: 'already-owned', record: snapshot() };
    const id = `free-item:${claimId}`;
    return commit(id, 'free-collectible', `Collected ${item.name || item.id}`, date, (draft) => {
      addReward(draft, { type: 'collectible', item }, 'free-collectible', date, id);
      return { itemId: item.id, collection: item.collection || null };
    });
  }

  function resolveBoxReward(reward) {
    if (reward?.type === 'bundle') {
      const rewards = (reward.rewards || []).map(resolveBoxReward).filter(Boolean);
      return rewards.length ? { ...reward, rewards } : null;
    }
    if (reward?.type !== 'collectible' || !reward.itemId) return reward;
    const item = getCatalogItem(reward.itemId);
    return item ? { ...reward, item } : null;
  }

  function grantBoxReward(draft, reward, date, transactionId) {
    if (reward.type === 'bundle') {
      return reward.rewards.flatMap((part, index) => grantBoxReward(draft, part, date, `${transactionId}:${index + 1}`));
    }
    if (reward.type === 'collectible') {
      if (draft.ownedItems.some((owned) => owned.itemId === reward.item.id)) {
        return reward.duplicateReward ? grantBoxReward(draft, reward.duplicateReward, date, `${transactionId}:duplicate`) : [];
      }
      addReward(draft, reward, 'surprise-box', date, transactionId);
      return [{ type: 'collectible', itemId: reward.item.id, name: reward.item.name, symbol: reward.item.symbol || '✦' }];
    }
    if (reward.type === 'currency') {
      addReward(draft, reward, 'surprise-box', date, transactionId);
      return [{ type: 'currency', currency: reward.currency, amount: reward.amount, name: `${reward.amount} ${reward.currency}`, symbol: reward.currency === 'gems' ? '◆' : '●' }];
    }
    addReward(draft, reward, 'surprise-box', date, transactionId);
    return [{ type: reward.type, name: reward.label || 'A surprise reward', symbol: reward.type === 'surpriseBox' ? '▣' : '✦' }];
  }

  function openSurpriseBox(boxId, date = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return { applied: false, reason: 'invalid-date', record: snapshot() };
    if (!boxId) return { applied: false, reason: 'missing-id', record: snapshot() };
    const box = record.boxes.find((entry) => entry.id === boxId);
    if (!box) return { applied: false, reason: 'not-found', record: snapshot() };
    if (box.openedAt) return { applied: false, reason: 'already-opened', box: clone(box), record: snapshot() };
    const pools = config.surpriseBoxPools || {};
    const pool = pools[box.boxType] || pools.default || [];
    const eligible = pool.map((entry) => ({ ...entry, reward: resolveBoxReward(entry.reward) }))
      .filter((entry) => Number(entry.weight) > 0 && entry.reward);
    const totalWeight = eligible.reduce((sum, entry) => sum + Number(entry.weight), 0);
    if (!totalWeight) return { applied: false, reason: 'missing-reward-pool', record: snapshot() };
    let choice = Math.random() * totalWeight;
    let prize = eligible[eligible.length - 1];
    for (const entry of eligible) {
      choice -= Number(entry.weight);
      if (choice < 0) { prize = entry; break; }
    }
    const transactionId = `box-open:${boxId}`;
    const result = commit(transactionId, 'surprise-box', `Opened a ${box.boxType || 'standard'} surprise box`, date, (draft) => {
      const storedBox = draft.boxes.find((entry) => entry.id === boxId);
      if (!storedBox || storedBox.openedAt) return {};
      const rewardOutcomes = grantBoxReward(draft, prize.reward, date, `${transactionId}:reward`);
      const rewardLabel = rewardOutcomes.length ? (prize.label || 'A surprise reward') : 'This surprise did not contain a new reward.';
      storedBox.openedAt = date.toISOString();
      storedBox.outcome = {
        label: rewardLabel,
        rewards: rewardOutcomes
      };
      return { boxOpened: boxId, outcome: storedBox.outcome };
    });
    return { ...result, reward: result.applied ? clone(record.boxes.find((entry) => entry.id === boxId).outcome) : null };
  }

  function subscribe(callback) {
    subscribers.add(callback);
    try { callback(snapshot()); }
    catch (error) { console.warn('A Stillmind rewards listener could not initialize.', error); }
    return () => subscribers.delete(callback);
  }

  function getSnapshot() { return snapshot(); }
  function getConfig() { return clone(config); }

  try {
    if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (error) { console.warn('Could not initialize Stillmind rewards on this device.', error); }

  window.StillmindRewards = Object.freeze({
    storageKey: STORAGE_KEY,
    getSnapshot,
    getConfig,
    subscribe,
    claimDailyReward,
    claimMonthlyMilestone,
    recordGameCompletion,
    preserveLegacyGameHistory,
    spendCurrency,
    purchaseCollectible,
    claimFreeCollectible,
    openSurpriseBox
  });
})();
