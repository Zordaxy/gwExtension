# Refactoring Plan: Separate Fetching from Parsing

## Goal

Split `parse.js` so that HTTP fetching and HTML parsing are separate concerns. Create a dedicated fetcher module with URL templates. All parse functions become pure DOM-in/data-out. Callers fetch first, then pass the DOM document to parsers.

---

## Current State

### Methods in `parse.js` that fetch internally

| Method | URL fetched | Returns |
|--------|------------|---------|
| `parseShopsPrice(resourceId)` | `/statlist.php?r={id}&type=i` | `{ title, Z: {minPrice, seller, isNoOffers}, G: {...} }` |
| `parseSellersPrice(resourceId, island)` | `/market.php?buy=1&item_id={id}` | gos shop price (number) |
| `parseResPrice(itemId)` | `/statlist.php?r={id}` | min resource price minus cost, or `"-"` |

### Methods in `parse.js` that are already pure (no fetch)

| Method | Input | Returns |
|--------|-------|---------|
| `parseMinAdvPrice(div, itemId, isDrop)` | DOM element (from caller) | `{ price, seller }` or null |
| `getMinShopPrice(div)` | DOM element (from caller) | number |
| `_aggregateShopRows(rows)` | array of TR elements | `{ minPrice, seller, isNoOffers }` |
| `parseIsland()` | reads live DOM (`document`) | `"G"` or `"Z"` |

### Where each is called

| Caller | Methods used |
|--------|-------------|
| `statistics.js` | `parseShopsPrice`, `parseSellersPrice`, `parseResPrice`, `parseIsland` |
| `search.js` | `parseShopsPrice`, `parseSellersPrice`, `parseIsland` |
| `bagSell.js` | `parseMinAdvPrice`, `getMinShopPrice` (fetches the page itself via `Http.get`) |

---

## Step 1: Create `src/js/urls.js` — URL template registry

Create a single file that exposes all game URL templates as functions.

```js
// src/js/urls.js
export const Urls = {
  statlistShops: (itemId) => `/statlist.php?r=${itemId}&type=i`,
  statlistResource: (itemId) => `/statlist.php?r=${itemId}`,
  marketBuy: (itemId) => `/market.php?buy=1&item_id=${itemId}`,
  marketAdvert: (itemId) => `/market.php?stage=2&item_id=${itemId}&action_id=1&island=-1`,
};
```

This gives callers a single import to pick the URL they need without hardcoding paths.

---

## Step 2: Create `src/js/fetcher.js` — dedicated fetch module

Create a module that uses `Http.fetchGet` and returns parsed DOM Documents for any URL template.

```js
// src/js/fetcher.js
import { Http } from "./http";
import { Urls } from "./urls";

export const Fetcher = {
  async statlistShops(itemId) {
    return Http.fetchGet(Urls.statlistShops(itemId));
  },
  async statlistResource(itemId) {
    return Http.fetchGet(Urls.statlistResource(itemId));
  },
  async marketBuy(itemId) {
    return Http.fetchGet(Urls.marketBuy(itemId));
  },
  async marketAdvert(itemId) {
    return Http.fetchGet(Urls.marketAdvert(itemId));
  },
};
```

All methods return a DOM Document (via `Http.fetchGet` which already parses HTML with windows-1251 decoding).

---

## Step 3: Remove fetching from `parse.js` methods

Transform the three fetching methods into pure parsers that accept a DOM Document as input.

### 3a. `parseShopsPrice(resourceId)` -> `parseShopsPrice(document)`

Before (fetches internally):
```js
async parseShopsPrice(resourceId) {
  const response = await Http.fetchGet(`/statlist.php?r=${resourceId}&type=i`);
  // ... parse response ...
}
```

After (pure parser):
```js
parseShopsPrice(doc) {
  // No longer async — no fetch
  const result = { Z: {}, G: {} };
  result.title = doc.querySelector("center table a b")?.innerText;
  // ... same parsing logic using doc instead of response ...
  return result;
}
```

- Remove `async` keyword
- Remove `Http` import dependency from parse.js (if no other method needs it after all three are converted)
- Replace `response` variable with `doc` parameter

### 3b. `parseSellersPrice(resourceId, island)` -> `parseSellersPrice(doc)`

Before:
```js
async parseSellersPrice(resourceId, island) {
  const response = await Http.fetchGet(`/market.php?buy=1&item_id=${resourceId}`);
  // ... parse response ...
}
```

After:
```js
parseSellersPrice(doc) {
  const gosShopRawPrice = doc.querySelector('table [class="greengraybg"] div b')?.innerText;
  // ... same parsing logic ...
  return +gosShopPrice;
}
```

- `island` parameter is not used in the parsing logic (only the URL differed), so it can be dropped
- Remove `async` keyword

### 3c. `parseResPrice(itemId)` -> `parseResPrice(doc, itemId)`

Before:
```js
async parseResPrice(itemId) {
  const response = await Http.fetchGet("/statlist.php?r=" + itemId);
  // ... parse response, subtract Storage.getCost(itemId) ...
}
```

After:
```js
parseResPrice(doc, itemId) {
  // ... same parsing logic using doc instead of response ...
  // Storage.getCost(itemId) subtraction stays as-is
  return prices.length ? Math.min.apply(Math, prices) - Storage.getCost(itemId) : "-";
}
```

- Still needs `itemId` for the `Storage.getCost` call
- Remove `async` keyword

### 3d. Clean up parse.js imports

After all three conversions, `Http` import can be removed from `parse.js`. The file becomes a pure parsing utility with zero network dependencies.

---

## Step 4: Update callers to fetch-then-parse

### 4a. `statistics.js` — `#renderStatisticsSection`

Before:
```js
const parsedShops = await Parse.parseShopsPrice(itemId);
await new Promise(resolve => setTimeout(resolve, 200));
const minSellerPrice = await Parse.parseSellersPrice(itemId, island);
await new Promise(resolve => setTimeout(resolve, 200));
let resourcePrice = await Parse.parseResPrice(itemId);
```

After:
```js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shopsDoc = await Fetcher.statlistShops(itemId);
await delay(200);
const marketDoc = await Fetcher.marketBuy(itemId);
await delay(200);
const resDoc = await Fetcher.statlistResource(itemId);

const parsedShops = Parse.parseShopsPrice(shopsDoc);
const minSellerPrice = Parse.parseSellersPrice(marketDoc);
let resourcePrice = Parse.parseResPrice(resDoc, itemId);
```

- Fetches remain sequential with 200ms gaps between each call (server rate-limiting constraint)
- Parse functions called synchronously on the already-fetched documents — parsing is decoupled from fetching
- Add imports: `Fetcher` from `"js/fetcher"`

### 4b. `search.js` — `findShopPrices`

Before:
```js
const parsedShops = await Parse.parseShopsPrice(resourceId);
const localData = parsedShops[island];
if (localData?.isNoOffers) {
  await new Promise(resolve => setTimeout(resolve, 200));
  localData.minPrice = await Parse.parseSellersPrice(resourceId, island);
}
```

After:
```js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shopsDoc = await Fetcher.statlistShops(resourceId);
const parsedShops = Parse.parseShopsPrice(shopsDoc);
const localData = parsedShops[island];
if (localData?.isNoOffers) {
  await delay(200);
  const marketDoc = await Fetcher.marketBuy(resourceId);
  localData.minPrice = Parse.parseSellersPrice(marketDoc);
}
```

- 200ms delay kept before the conditional second fetch
- The outer `processWithDelay` loop provides additional gap between items
- Add import: `Fetcher`

### 4c. `bagSell.js` — `findBagList`

Before (uses RxJS `Http.get`, parses raw HTML manually):
```js
Http.get(`/market.php?stage=2&item_id=${element.id}&action_id=1&island=-1`)
  .subscribe((xhr) => {
    let div = document.createElement("div");
    div.innerHTML = xhr.response;
    let minItem = Parse.parseMinAdvPrice(div, element.id, isDrop);
    let minShopPrice = Parse.getMinShopPrice(div);
    // ...
  });
```

After (uses Fetcher, returns DOM Document):
```js
const doc = await Fetcher.marketAdvert(element.id);
const isDrop = Ordinal.isDrop(element.id);
let minItem = Parse.parseMinAdvPrice(doc, element.id, isDrop);
let minShopPrice = Parse.getMinShopPrice(doc);
```

- Replace `Http.get` + manual `div.innerHTML` with `Fetcher.marketAdvert`
- Replace `setInterval` loop with `Http.processWithDelay` or async loop (the `setInterval` pattern needs to change to support `await`)
- `parseMinAdvPrice` and `getMinShopPrice` already accept a DOM node — they work as-is with a Document since `querySelectorAll` works on both
- Add import: `Fetcher`. Remove import: `Http`

---

## Step 5: Verify and clean up

1. Remove `Http` import from `parse.js` — it should have no remaining fetch calls
2. Remove `Http` import from `bagSell.js` — now uses `Fetcher` instead
3. Confirm `_aggregateShopRows` and `parseIsland` are unchanged (they were already pure)
4. Confirm `parseMinAdvPrice` and `getMinShopPrice` work with DOM Document (not just a `div` element) — `querySelectorAll` works on both `Document` and `Element`, so no change needed

---

## File changes summary

| File | Action |
|------|--------|
| `src/js/urls.js` | **New** — URL template registry |
| `src/js/fetcher.js` | **New** — fetch functions returning DOM Documents |
| `src/js/parse.js` | **Modify** — remove all `Http.fetchGet` calls, accept `doc` parameter instead, remove `Http` import |
| `src/js/features/statistics.js` | **Modify** — fetch via `Fetcher` sequentially with 200ms gaps, pass docs to `Parse` |
| `src/js/search.js` | **Modify** — fetch via `Fetcher`, pass doc to `Parse` |
| `src/js/features/bagSell.js` | **Modify** — replace `Http.get` + manual HTML parsing with `Fetcher.marketAdvert`, replace `setInterval` with async loop |
| `src/js/http.js` | **No change** — `fetchGet` stays, used by `Fetcher` |

---

## Execution order

1. Create `urls.js` and `fetcher.js` (no existing code breaks — these are additive)
2. Refactor `parse.js` — convert the three fetching methods to accept `doc` (Steps 3a, 3b, 3c, 3d)
3. Update `statistics.js` (Step 4a)
4. Update `search.js` (Step 4b)
5. Update `bagSell.js` (Step 4c) — this is the most involved since it also changes the iteration pattern from `setInterval` to async
6. Clean up imports (Step 5)

Steps 3 and 4 must happen together per feature (changing a parse signature and its caller at the same time), so do them as pairs: parse method + its callers.
