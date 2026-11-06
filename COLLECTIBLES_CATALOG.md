# Adding collection designs

The starter catalog is data-only in `collectibles-catalog.js`. Collection and shop rendering reads the catalog, so adding or changing an item does not require editing the screen or rewards logic.

## Add an artwork file

Put a relative asset path in an item's `image` field. PNG, WebP, and JPEG are displayed by the browser. Transparent PNG or WebP works best for sticker art.
For example, add a file at `assets/collectibles/quiet-moon.webp` and set
`image: 'assets/collectibles/quiet-moon.webp'`. 
If `image` is `null`, the card uses its `symbol` as a simple placeholder design.

## Add a catalog item

Add a new object to the `items` array in `collectibles-catalog.js` with a unique `id`, name, description, image or symbol, category list, collection ID, month or event, rarity, currency and price, active state, acquisition type, availability dates, and limited-edition flag. `acquisition` can be `purchase`, `free`, or `reward-only`. Currency prices must be positive coins or gems for purchases.

To add a new category, add it to the `categories` list and include that category ID in relevant items' `categories` arrays. Existing item IDs and historical collection records should be retained when a collection expires. Set `availableUntil` to stop new purchases while leaving the item visible in players' albums.

To include a collectible in a surprise box, set `acquisition: 'reward-only'`
and add its ID to a prize in `rewards-config.js` under
`StillmindRewardConfig.surpriseBoxPools`. Each prize has a relative `weight`, a
short reveal `label`, and a `reward`. Add an optional `duplicateReward` to
collectible prizes so a previously owned sticker can convert into coins or
gems. Box rewards are added to the album and reward history when the box opens.

This app is a static, local-only prototype, so there is no upload/admin screen.
For now, adding designs means adding the image and catalog entry to the project and publishing the updated static files. The app UI and reward engine do not need code changes for a new item. A shared upload tool for all players will require an authenticated backend or content service later.
