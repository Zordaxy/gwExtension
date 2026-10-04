import { Settings } from 'js/settings';
import { STORAGE_KEY } from 'js/settingsConfig';
import { sellerProfileUrl, sellerSearchUrl } from 'js/parseUtils';

export const RealtyShopBump = {
  makeTableCollapsible(table, label) {
    const body = table.tBodies[0];
    body.hidden = true;
    const buttons = [...table.tHead.querySelectorAll('th')].map((cell) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'realty-summary-toggle';
      button.textContent = cell.textContent;
      button.title = `Toggle ${label} table`;
      button.setAttribute('aria-expanded', 'false');
      button.onclick = () => {
        body.hidden = !body.hidden;
        buttons.forEach((toggle) => toggle.setAttribute('aria-expanded', String(!body.hidden)));
      };
      cell.replaceChildren(button);
      return button;
    });
  },

  renderSeller(cell, seller, href) {
    cell.textContent = seller ?? 'No offers';
    const url = sellerProfileUrl(href) || sellerSearchUrl(seller === 'No offers' ? null : seller);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.textContent = cell.textContent;
    link.target = '_blank';
    link.rel = 'noopener';
    cell.replaceChildren(link);
  },

  shops() {
    const shops = new Map();
    document.querySelectorAll('table.withborders tr').forEach((row) => {
      const link = row.cells[0]?.querySelector('a[href*="object.php?id="]');
      if (!link?.textContent.trim().startsWith('Магазин')) return;
      const url = new URL(link.href);
      const id = url.searchParams.get('id');
      if (url.origin === location.origin && url.pathname === '/object.php' && /^\d+$/.test(id)) {
        shops.set(id, { id, name: link.textContent.trim() });
      }
    });
    return [...shops.values()];
  },

  interleaveShops(shops) {
    const groups = new Map();
    for (const shop of shops) {
      if (!groups.has(shop.name)) groups.set(shop.name, []);
      groups.get(shop.name).push(shop);
    }
    const ordered = [];
    // Take one property of each name per round, preserving order within a type.
    for (let index = 0; ordered.length < shops.length; index++) {
      for (const group of groups.values()) {
        if (index < group.length) ordered.push(group[index]);
      }
    }
    return ordered;
  },

  init() {
    if (location.pathname !== '/info.realty.php' || document.querySelector('[data-test-bump-shop-prices]')) return;
    const heading = [...document.querySelectorAll('div')].find((element) =>
      [...element.querySelectorAll(':scope > a[href*="/info.php?id="]')].some((link) =>
        link.querySelector('b')?.textContent.trim() === 'Michegan' &&
        link.nextSibling?.nodeType === 3 && /^\s*:\s*Недвижимость/.test(link.nextSibling.textContent)));
    if (!heading || !this.shops().length) return;
    const progress = document.createElement('span');
    progress.setAttribute('data-test-realty-shop-progress', '');
    progress.className = 'realty-shop-progress';
    progress.title = 'Shops checked';
    const itemProgress = document.createElement('span');
    itemProgress.className = 'realty-shop-item-progress';
    itemProgress.setAttribute('data-test-realty-shop-item-progress', '');
    itemProgress.hidden = true;
    const currentShop = document.createElement('a');
    currentShop.target = '_blank';
    currentShop.rel = 'noopener';
    const itemBar = document.createElement('progress');
    itemBar.setAttribute('aria-label', 'Current shop items checked');
    const itemText = document.createElement('span');
    const itemProgressRow = document.createElement('span');
    itemProgressRow.className = 'realty-shop-item-progress-row';
    itemProgressRow.append(itemBar, itemText);
    itemProgress.append(currentShop, itemProgressRow);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'apply-all realty-manual-bump';
    button.textContent = 'bump shop prices';
    button.setAttribute('data-test-bump-shop-prices', '');
    const continuousButton = document.createElement('button');
    continuousButton.type = 'button';
    continuousButton.className = 'apply-all realty-continuous-bump';
    continuousButton.setAttribute('data-test-continuously-bump', '');
    const status = document.createElement('span');
    status.className = 'realty-bump-status';
    status.setAttribute('data-test-continuous-bump-status', '');
    const counter = document.createElement('span');
    counter.className = 'realty-bump-counter';
    counter.setAttribute('data-test-continuous-bump-count', '');
    const countdown = document.createElement('span');
    countdown.className = 'realty-bump-countdown';
    countdown.setAttribute('data-test-continuous-bump-countdown', '');
    countdown.hidden = true;
    const elapsed = document.createElement('span');
    elapsed.className = 'realty-bump-elapsed';
    elapsed.setAttribute('data-test-continuous-bump-elapsed', '');
    const started = document.createElement('time');
    started.className = 'realty-bump-started';
    started.setAttribute('data-test-continuous-bump-started', '');
    started.hidden = true;
    heading.append(' ', button, ' ', continuousButton);
    const summaryLayout = document.createElement('div');
    summaryLayout.className = 'realty-bump-summary-layout';
    const tables = document.createElement('div');
    tables.className = 'realty-bump-tables';
    const statusPanel = document.createElement('div');
    statusPanel.className = 'realty-bump-panel';
    statusPanel.setAttribute('data-test-continuous-bump-panel', '');
    statusPanel.append(status, progress, counter, started, elapsed, countdown, itemProgress);
    summaryLayout.append(tables, statusPanel);
    heading.append(summaryLayout);
    const sellerTable = document.createElement('table');
    sellerTable.className = 'realty-seller-summary';
    sellerTable.setAttribute('data-test-realty-seller-summary', '');
    const sellerDetails = document.createElement('div');
    sellerDetails.className = 'realty-sellers-details';
    sellerDetails.append(sellerTable);
    const sellerHeader = sellerTable.createTHead().insertRow();
    ['seller', 'iterations', 'items'].forEach((text) => {
      const cell = document.createElement('th');
      cell.textContent = `${text} · 0`;
      sellerHeader.append(cell);
    });
    const sellerBody = sellerTable.createTBody();
    const empty = sellerBody.insertRow().insertCell();
    empty.colSpan = 3;
    empty.textContent = 'No changed items yet.';
    this.makeTableCollapsible(sellerTable, 'seller');
    sellerHeader.cells[0].querySelector('button').textContent = 'seller · 0';
    tables.append(sellerDetails);
    const propertyDetails = document.createElement('div');
    propertyDetails.className = 'realty-sellers-details';
    const propertyTable = document.createElement('table');
    propertyTable.className = 'realty-seller-summary realty-property-summary';
    propertyTable.setAttribute('data-test-realty-property-summary', '');
    const propertyHeader = propertyTable.createTHead().insertRow();
    ['property', 'iterations', 'updates'].forEach((text) => {
      const cell = document.createElement('th');
      cell.textContent = text;
      propertyHeader.append(cell);
    });
    const propertyBody = propertyTable.createTBody();
    this.makeTableCollapsible(propertyTable, 'property');
    propertyDetails.append(propertyTable);
    tables.append(propertyDetails);
    const propertyTotals = new Map(this.shops().map((shop) => [shop.id, { ...shop, iterations: 0, runsWithUpdate: 0 }]));
    const updateProperties = (results = []) => {
      for (const result of results) {
        const previous = propertyTotals.get(result.id);
        propertyTotals.set(result.id, { id: result.id, name: result.name,
          iterations: (previous?.iterations || 0) + (result.ok && !result.skipped ? 1 : 0),
          runsWithUpdate: (previous?.runsWithUpdate || 0) +
            (result.ok && !result.skipped && result.changes?.length > 0 ? 1 : 0) });
      }
      propertyBody.replaceChildren();
      propertyHeader.cells[0].querySelector('button').textContent = `property · ${propertyTotals.size}`;
      propertyHeader.cells[1].querySelector('button').textContent =
        `iterations · ${[...propertyTotals.values()].reduce((total, property) => total + property.iterations, 0)}`;
      propertyHeader.cells[2].querySelector('button').textContent =
        `updates · ${[...propertyTotals.values()].reduce((total, property) => total + property.runsWithUpdate, 0)}`;
      [...propertyTotals.values()].sort((a, b) => b.iterations - a.iterations).forEach((property) => {
        const row = propertyBody.insertRow();
        const link = document.createElement('a');
        link.href = `/object.php?id=${property.id}`;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = `${property.name} #${property.id}`;
        row.insertCell().append(link);
        row.insertCell().textContent = String(property.iterations);
        row.insertCell().textContent = String(property.runsWithUpdate);
      });
    };
    updateProperties();
    const sellerTotals = new Map();
    const updateSellers = (results) => {
      for (const entry of this.sellerSummary(results)) {
        const previous = sellerTotals.get(entry.seller);
        sellerTotals.set(entry.seller, { seller: entry.seller,
          iterations: (previous?.iterations || 0) + 1,
          updatedItems: (previous?.updatedItems || 0) + entry.updatedItems,
          sellerUrl: entry.sellerUrl || previous?.sellerUrl });
      }
      if (!sellerTotals.size) return;
      sellerHeader.cells[0].querySelector('button').textContent = `seller · ${sellerTotals.size}`;
      sellerHeader.cells[1].querySelector('button').textContent =
        `iterations · ${[...sellerTotals.values()].reduce((total, seller) => total + seller.iterations, 0)}`;
      sellerHeader.cells[2].querySelector('button').textContent =
        `items · ${[...sellerTotals.values()].reduce((total, seller) => total + seller.updatedItems, 0)}`;
      sellerBody.replaceChildren();
      [...sellerTotals.values()].sort((a, b) => b.updatedItems - a.updatedItems || a.seller.localeCompare(b.seller))
        .forEach((entry) => {
          const row = sellerBody.insertRow();
          const cell = row.insertCell();
          this.renderSeller(cell, entry.seller, entry.sellerUrl);
          row.insertCell().textContent = String(entry.iterations);
          row.insertCell().textContent = String(entry.updatedItems);
        });
    };

    let waiting;
    let continuous = false;
    let running = false;
    let toggling = false;
    let runs = 0;
    let unchangedShops = new Set();
    let countdownTimer;
    let nextRunAt;
    const canStartRun = () => !running && !waiting;
    let continuousStartedAt = null;
    let accumulatedContinuousMs = 0;
    const interval = () => {
      const minutes = Number(Settings.shopBumpIntervalMinutes);
      const base = Number.isInteger(minutes) && minutes >= 1 ? minutes : 5;
      const hour = new Date().getHours();
      return Settings.nightTimeUpdate && hour >= 15 && hour < 21 ? base * 2 : base;
    };
    const updateElapsed = () => {
      const milliseconds = accumulatedContinuousMs + (continuousStartedAt === null ? 0 : Date.now() - continuousStartedAt);
      const minutes = Math.max(0, Math.floor(milliseconds / 60000));
      elapsed.textContent = `Total time: ${[Math.floor(minutes / 60), minutes % 60]
        .map((value) => String(value).padStart(2, '0')).join(':')}`;
    };
    const updateCountdown = () => {
      updateElapsed();
      countdown.hidden = !continuous;
      if (!continuous) return;
      const seconds = Math.max(0, Math.ceil((nextRunAt - Date.now()) / 1000));
      countdown.textContent = `Next run: ${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    };
    const setCountdown = (scheduledTime) => {
      nextRunAt = Number.isFinite(scheduledTime) ? scheduledTime : Date.now() + interval() * 60000;
      clearInterval(countdownTimer);
      countdownTimer = setInterval(updateCountdown, 1000);
      updateCountdown();
    };
    document.addEventListener('visibilitychange', updateCountdown);
    window.addEventListener('pagehide', () => clearInterval(countdownTimer));
    const updateStatus = () => {
      button.disabled = running || continuous || toggling;
      continuousButton.disabled = toggling || (running && !continuous);
      continuousButton.textContent = continuous ? 'stop continuously bump' : 'continuously bump';
      continuousButton.classList.toggle('realty-continuous-bump--running', continuous && running);
      status.textContent = running ? (continuous ? 'Active · bumping' : 'Bumping')
        : continuous ? `Active · every ${interval()} min` : 'Inactive';
      status.dataset.state = running ? 'running' : continuous ? 'waiting' : 'inactive';
      const inactive = !running && !continuous;
      counter.hidden = inactive;
      progress.hidden = inactive;
      elapsed.hidden = inactive;
      started.hidden = inactive || !started.dateTime;
      itemProgress.hidden = inactive || !currentShop.textContent;
      counter.textContent = `Runs: ${runs}`;
      updateElapsed();
    };
    updateStatus();
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === 'continuous-shop-bump-schedule') {
        if (continuous) {
          setCountdown(message.nextRunAt);
          updateStatus();
        }
        sendResponse({ ok: continuous });
        return;
      }
      if (message?.type === 'continuous-shop-bump-tick') {
        sendResponse({ ok: continuous });
        if (continuous) setCountdown(message.nextRunAt);
        if (continuous && canStartRun()) run({ consoleOnly: true });
        return;
      }
      if (!waiting || message?.runId !== waiting.runId) return;
      if (message.type === 'realty-shop-bump-progress') {
        const { checked, total } = message.progress || {};
        if (!Number.isInteger(checked) || !Number.isInteger(total) || checked < 0 || total < checked || checked < waiting.checked) return;
        waiting.checked = checked;
        itemBar.max = total || 1;
        itemBar.value = total ? checked : 1;
        itemText.textContent = `${checked}/${total}`;
        itemBar.setAttribute('aria-valuetext', itemText.textContent);
        sendResponse({ ok: true });
        return;
      }
      if (message.type !== 'realty-shop-bump-result') return;
      waiting.resolve(message.result);
      waiting = null;
      sendResponse({ ok: true });
    });
    const run = async ({ consoleOnly = false } = {}) => {
      if (!canStartRun()) return;
      running = true;
      updateStatus();
      const shops = this.interleaveShops(this.shops());
      const results = [];
      const nextUnchangedShops = new Set();
      let skipped = 0;
      const updateProgress = () => {
        progress.textContent = `shops: ${results.length}/${shops.length}${skipped ? ` (${skipped} skipped)` : ''}`;
      };
      progress.textContent = `shops: 0/${shops.length}`;
      try {
        for (const shop of shops) {
          itemProgress.hidden = false;
          currentShop.textContent = `${shop.name} #${shop.id}`;
          currentShop.href = `/object.php?id=${shop.id}`;
          if (consoleOnly && unchangedShops.has(shop.id)) {
            skipped++;
            results.push({ ...shop, ok: true, skipped: true, changes: [] });
            itemBar.max = 1;
            itemBar.value = 1;
            itemBar.removeAttribute('aria-valuetext');
            itemText.textContent = 'Skipped · no changes last run';
            updateProgress();
            continue;
          }
          itemBar.max = 1;
          itemBar.removeAttribute('value');
          itemBar.removeAttribute('aria-valuetext');
          itemText.textContent = 'Loading…';
          // Only open the next tab after the previous tab reports its save result.
          await new Promise((resolve) => setTimeout(resolve, 200));
          const runId = crypto.randomUUID();
          const completed = new Promise((resolve) => { waiting = { runId, resolve, checked: -1 }; });
          let result;
          try {
            const opened = await chrome.runtime.sendMessage({ type: 'open-shop-bump', propertyId: shop.id, runId });
            result = opened?.ok ? await completed : { ok: false, error: opened?.error || 'Could not open shop tab' };
          } catch (error) {
            result = { ok: false, error: error.message };
          }
          waiting = null;
          results.push({ ...shop, ...result });
          if (result.ok && result.changes?.length === 0) nextUnchangedShops.add(shop.id);
          if (!result.ok) itemText.textContent = 'Failed';
          updateProgress();
        }
        if (consoleOnly) unchangedShops = nextUnchangedShops;
        updateSellers(results);
        updateProperties(results);
        if (consoleOnly) {
          runs++;
          console.log('continuously bump results', { run: runs, results });
          console.log('continuously bump seller summary', { run: runs, sellers: this.sellerSummary(results) });
        } else {
          this.showResults(results);
        }
      } finally {
        running = false;
        updateStatus();
      }
    };
    button.onclick = () => {
      if (!button.disabled) return run();
    };
    continuousButton.onclick = async () => {
      if (continuousButton.disabled) return;
      const enable = !continuous;
      const requestedStartAt = Date.now();
      toggling = true;
      updateStatus();
      try {
        const response = await chrome.runtime.sendMessage(enable
          ? { type: 'start-continuous-shop-bump', minutes: Settings.shopBumpIntervalMinutes,
            nightTimeUpdate: Settings.nightTimeUpdate }
          : { type: 'stop-continuous-shop-bump' });
        if (!response?.ok) throw new Error(response?.error || 'Could not change continuous bump state');
        if (enable) {
          continuousStartedAt = requestedStartAt;
          const date = new Date(requestedStartAt);
          started.dateTime = date.toISOString();
          started.textContent = `Started: ${date.toLocaleString(undefined, {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
          })}`;
          started.hidden = false;
        }
        else {
          accumulatedContinuousMs += Math.max(0, Date.now() - continuousStartedAt);
          continuousStartedAt = null;
        }
        continuous = enable;
        if (enable) {
          unchangedShops = new Set();
          setCountdown(response.nextRunAt);
          document.querySelector('[data-test-shop-bump-results]')?.remove();
          run({ consoleOnly: true });
        } else {
          clearInterval(countdownTimer);
          updateCountdown();
        }
      } catch (error) {
        console.error('continuously bump failed', error);
      } finally {
        toggling = false;
        updateStatus();
      }
    };
    // Settings.watch updates Settings first, so popup changes take effect
    // without reloading the realty page or interrupting an active batch.
    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (!continuous || area !== 'local' || !changes[STORAGE_KEY]) return;
      chrome.runtime.sendMessage({ type: 'start-continuous-shop-bump', minutes: Settings.shopBumpIntervalMinutes,
        nightTimeUpdate: Settings.nightTimeUpdate })
        .then((response) => {
          if (!response?.ok) throw new Error(response?.error || 'Could not update bump interval');
          if (!continuous) return;
          setCountdown(response.nextRunAt);
          updateStatus();
        }).catch((error) => console.error('Could not update continuous bump interval', error));
    });
  },

  sellerSummary(results) {
    const counts = new Map();
    const urls = new Map();
    results.filter((result) => result.ok).forEach((result) => {
      (result.changes || []).forEach((change) => {
        const seller = change.seller ?? 'No offers';
        counts.set(seller, (counts.get(seller) || 0) + 1);
        if (change.sellerUrl) urls.set(seller, change.sellerUrl);
      });
    });
    return [...counts].map(([seller, updatedItems]) => ({ seller, updatedItems,
      ...(urls.has(seller) ? { sellerUrl: urls.get(seller) } : {}) }));
  },

  showResults(results) {
    document.querySelector('[data-test-shop-bump-results]')?.remove();
    const dialog = document.createElement('dialog');
    dialog.setAttribute('data-test-shop-bump-results', '');
    dialog.className = 'shop-bump-results';
    const title = document.createElement('h3');
    title.textContent = 'Shop price update results';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'apply-all';
    close.textContent = 'Close';
    close.onclick = () => dialog.remove();
    dialog.append(title, close);
    for (const result of results) {
      const heading = document.createElement('h4');
      const shopLink = document.createElement('a');
      shopLink.href = `/object.php?id=${result.id}`;
      shopLink.target = '_blank';
      shopLink.rel = 'noopener';
      shopLink.textContent = `${result.name} #${result.id}`;
      heading.append(shopLink);
      dialog.append(heading);
      if (!result.ok || !result.changes?.length) {
        const text = document.createElement('p');
        text.textContent = result.ok ? 'No prices changed.' : `Failed: ${result.error}`;
        dialog.append(text);
        continue;
      }
      const table = document.createElement('table');
      const header = table.insertRow();
      ['Item', 'Old price', "Seller's price", 'New price', 'Seller'].forEach((text) => {
        const cell = document.createElement('th');
        cell.textContent = text;
        header.append(cell);
      });
      result.changes.forEach((change) => {
        const row = table.insertRow();
        [change.item, change.from, change.sellerPrice ?? '—', change.to].forEach((value) => {
          row.insertCell().textContent = String(value);
        });
        this.renderSeller(row.insertCell(), change.seller, change.sellerUrl);
      });
      dialog.append(table);
    }
    document.body.append(dialog);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  },
};
