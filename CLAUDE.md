# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GW Checker is a Chrome extension (Manifest v3) for the gwars.io game. It provides trading, pricing, inventory management, and economic utilities as a content script injected into the game's pages.

## Build Commands

```bash
npm run build   # Production build (webpack --mode production)
npm run dev     # Development build (webpack --mode development)
```

Output goes to `dist/` — contains `bundle.js`, `main.css`, and copied assets (manifest.json, icon.png, popup.html). Load `dist/` as an unpacked Chrome extension for testing.

There are no tests or linting configured.

## Architecture

**Entry point:** `src/main.js` → `App.init()` in `src/js/app.js`

**Initialization chain:**
1. `Widgets.init()` — creates UI buttons in the game's chat navigation bar based on current page and `Settings.showButtons`
2. `SellForm.init()` — auto-fills sell forms when on a sell page
3. `ParseTransactions.init()` — counts and displays sale transactions
4. `ActionButtons.init()` — adds game action shortcut buttons

**Layer structure:**

- **Data** (`src/data/`) — static game item databases. `Ordinal` is the central accessor. Production items split by island: `production-on-g.js` (G island) and `production-on-z.js` (Z island). `drop.js` and `highTeck.js` define other item types.
- **Core utilities** (`src/js/`) — `Http` (RxJS ajax + fetch with windows-1251 decoding), `Parse` (HTML/DOM parsing), `Storage` (localStorage wrapper + cost calculation from resource prices), `Settings` (global config: resource prices, friends list, island, feature toggles).
- **Features** (`src/js/features/`) — self-contained modules: `statistics.js` (price checker/profit analysis), `bagSell.js` (inventory selling), `eco.js` (experience-based pricing), `rent.js` (item rental), `actionButtons.js` (game shortcuts).
- **UI widgets** (`src/js/widgets/`) — `Menu` (nav link creation), `Result` (modal results table), `Blacker` (dark overlay), `SettingsTab` (settings panel).
- **Initialization** (`src/js/initialization/`) — `widgets.js` (conditional button setup), `SellForm.js` (form auto-fill).

**Webpack aliases:** `js` → `src/js/`, `data` → `src/data/` (use in imports like `import { X } from "js/module"`).

**Key patterns:**
- Modules export singleton objects (not classes to instantiate)
- HTTP: RxJS observables (`Http.get`/`Http.post`) for reactive flows; `Http.fetchGet` for async/await with windows-1251 text decoding
- `Http.processWithDelay` throttles sequential requests with a configurable interval (default 400ms)
- **All HTTP requests to gwars.io must have at least a 200ms gap between them.** Never fire multiple requests in parallel (no `Promise.all` for fetches). Use sequential awaits with `await delay(200)` between calls.
- Cost calculation in `Storage.getCost()` multiplies item resource requirements by prices from `Settings.resources`
- All DOM manipulation targets the gwars.io page structure directly
