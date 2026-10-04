import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, getByRole } from '@testing-library/dom';
import { loadPage } from '../helpers/loadPage';
import { RealtyShopBump } from 'js/features/realtyShopBump';
import { Settings } from 'js/settings';
import { STORAGE_KEY } from 'js/settingsConfig';

let receive;
let send;
let settingsChanged;
beforeEach(() => {
  receive = undefined;
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 4, 12));
  history.replaceState({}, '', '/info.realty.php?id=1736883');
  loadPage('realty-shops');
  send = vi.fn().mockResolvedValue({ ok: true });
  Settings.shopBumpIntervalMinutes = 5;
  Settings.nightTimeUpdate = true;
  vi.stubGlobal('chrome', { runtime: {
    sendMessage: send, onMessage: { addListener: (callback) => { receive = callback; } },
  }, storage: { onChanged: { addListener: (callback) => { settingsChanged = callback; } } } });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  history.replaceState({}, '', '/objectedit.php?id=100001');
});

test('captured realty fixture selects exactly the 12 shops and places both progress indicators in the status panel', () => {
  expect(RealtyShopBump.shops().map(({ id }) => id)).toEqual([
    '118340', '101661', '124487', '168229', '73749', '176354',
    '169998', '176113', '108288', '106277', '159930', '103702',
  ]);
  RealtyShopBump.init();
  const button = getByRole(document.body, 'button', { name: 'bump shop prices' });
  const progress = document.querySelector('[data-test-realty-shop-progress]');
  const itemProgress = document.querySelector('[data-test-realty-shop-item-progress]');
  expect(button.parentElement.textContent).toContain('Michegan: Недвижимость');
  expect(button.type).toBe('button');
  expect(itemProgress.hidden).toBe(true);
  const panel = document.querySelector('[data-test-continuous-bump-panel]');
  expect([...panel.children].map((element) => element.className)).toEqual([
    'realty-bump-status', 'realty-shop-progress', 'realty-bump-counter', 'realty-bump-started',
    'realty-bump-elapsed', 'realty-bump-countdown', 'realty-shop-item-progress',
  ]);
  const tables = panel.previousElementSibling;
  expect(tables.querySelector('[data-test-realty-seller-summary]')).not.toBeNull();
  expect(tables.querySelector('[data-test-realty-property-summary]')).not.toBeNull();
  expect(itemProgress.parentElement).toBe(panel);
  expect(progress.parentElement).toBe(panel);
  expect(progress.previousElementSibling.className).toBe('realty-bump-status');
  expect(itemProgress.children).toHaveLength(2);
  expect(itemProgress.firstElementChild.tagName).toBe('A');
  expect(itemProgress.lastElementChild.className).toBe('realty-shop-item-progress-row');
  expect(itemProgress.lastElementChild.querySelector('progress')).not.toBeNull();
  expect([...panel.children].filter((element) => !element.hidden).map((element) => element.textContent))
    .toEqual(['Inactive']);
});

test.each(['Other player', 'michegan', 'Michegan II'])('does not add realty bump controls on %s properties', (owner) => {
  const name = document.querySelector('div > a[href="/info.php?id=1736883"] b');
  name.textContent = owner;
  const unrelated = document.createElement('div');
  unrelated.innerHTML = '<a href="/info.php?id=1736883"><b>Michegan</b></a>: Profile';
  document.body.prepend(unrelated);
  RealtyShopBump.init();
  expect(document.querySelector('[data-test-bump-shop-prices]')).toBeNull();
  expect(document.querySelector('[data-test-continuously-bump]')).toBeNull();
  expect(document.querySelector('[data-test-realty-seller-summary]')).toBeNull();
  expect(document.querySelector('[data-test-realty-property-summary]')).toBeNull();
  expect(receive).toBeUndefined();
  expect(send).not.toHaveBeenCalled();
});

test.each(['seller', 'property'])('%s table collapses from its column headers and keeps the header visible', (type) => {
  RealtyShopBump.init();
  const table = document.querySelector(`[data-test-realty-${type}-summary]`);
  const headers = [...table.tHead.querySelectorAll('button')];
  expect(table.tBodies[0].hidden).toBe(true);
  expect(table.parentElement.querySelector('summary')).toBeNull();
  for (const header of headers) {
    fireEvent.click(header);
    expect(table.tBodies[0].hidden).toBe(false);
    expect(table.tHead.hidden).toBe(false);
    expect(headers.every((button) => button.getAttribute('aria-expanded') === 'true')).toBe(true);
    fireEvent.click(header);
    expect(table.tBodies[0].hidden).toBe(true);
    expect(headers.every((button) => button.getAttribute('aria-expanded') === 'false')).toBe(true);
  }
});

test.each([
  ['cyberkid', '/search.php?key=cyberkid'],
  ['BSAU', '/search.php?key=BSAU'],
  ['Доменатор', '/search.php?key=%C4%EE%EC%E5%ED%E0%F2%EE%F0'],
  ['Seller & friend', '/search.php?key=Seller%20%26%20friend'],
])('seller without a profile URL links to the player lookup: %s', (seller, expected) => {
  const cell = document.createElement('td');
  RealtyShopBump.renderSeller(cell, seller);
  const link = getByRole(cell, 'link', { name: seller });
  expect(link.getAttribute('href')).toBe(expected);
  expect(link.target).toBe('_blank');
  expect(link.rel).toBe('noopener');
  RealtyShopBump.showResults([{ id: '118340', name: 'Shop', ok: true,
    changes: [{ item: 'Mask', from: 10, to: 8, seller }] }]);
  expect(document.querySelector('[data-test-shop-bump-results] td a').getAttribute('href')).toBe(expected);
});

test('a missing seller stays plain text instead of linking the no-offers label', () => {
  const cell = document.createElement('td');
  RealtyShopBump.renderSeller(cell, null);
  expect(cell.textContent).toBe('No offers');
  expect(cell.querySelector('a')).toBeNull();
});

test.each([
  [['gg', 'gg', 'hh', 'hh', 'ss', 'ss', 'mm'], ['gg', 'hh', 'ss', 'mm', 'gg', 'hh', 'ss']],
  [['gg', 'gg', 'gg', 'hh'], ['gg', 'hh', 'gg', 'gg']],
  [[], []],
])('interleaves duplicate property names: %j', (names, expected) => {
  const shops = names.map((name, id) => ({ name, id }));
  const ordered = RealtyShopBump.interleaveShops(shops);
  expect(ordered.map(({ name }) => name)).toEqual(expected);
  expect(new Set(ordered).size).toBe(shops.length);
  expect(shops.map(({ name }) => name)).toEqual(names);
  for (const name of new Set(names)) {
    expect(ordered.filter((shop) => shop.name === name))
      .toEqual(shops.filter((shop) => shop.name === name));
  }
});

test('opens interleaved shops one at a time, counts confirmed results, and shows changed prices and failures', async () => {
  RealtyShopBump.init();
  const button = getByRole(document.body, 'button', { name: 'bump shop prices' });
  const progress = document.querySelector('[data-test-realty-shop-progress]');
  const itemProgress = document.querySelector('[data-test-realty-shop-item-progress]');
  fireEvent.click(button);
  fireEvent.click(button);
  expect(progress.textContent).toBe('shops: 0/12');
  expect(itemProgress.hidden).toBe(false);
  expect(itemProgress.querySelector('a').getAttribute('href')).toBe('/object.php?id=118340');
  await vi.advanceTimersByTimeAsync(200);
  expect(send).toHaveBeenCalledOnce();
  expect(send.mock.calls[0][0]).toMatchObject({ type: 'open-shop-bump', propertyId: '118340' });
  await vi.advanceTimersByTimeAsync(5000);
  expect(send).toHaveBeenCalledOnce();
  expect(progress.textContent).toBe('shops: 0/12');
  expect(document.querySelector('[data-test-shop-bump-results]')).toBeNull();

  receive({ type: 'realty-shop-bump-result', runId: 'unrelated', result: { ok: true } }, {}, vi.fn());
  await vi.advanceTimersByTimeAsync(0);
  expect(progress.textContent).toBe('shops: 0/12');
  const firstRun = send.mock.calls[0][0].runId;
  receive({ type: 'realty-shop-bump-progress', runId: firstRun, progress: { checked: 3, total: 7 } }, {}, vi.fn());
  expect(itemProgress.textContent).toContain('3/7');
  expect(itemProgress.querySelector('progress').value).toBe(3);
  expect(itemProgress.querySelector('progress').max).toBe(7);
  expect(progress.textContent).toBe('shops: 0/12');
  receive({ type: 'realty-shop-bump-progress', runId: 'unrelated', progress: { checked: 7, total: 7 } }, {}, vi.fn());
  receive({ type: 'realty-shop-bump-progress', runId: firstRun, progress: { checked: 2, total: 7 } }, {}, vi.fn());
  expect(itemProgress.textContent).toContain('3/7');
  for (let index = 0; index < 12; index++) {
    const runId = send.mock.calls[index][0].runId;
    const result = index === 0 ? { ok: true, changes: [
      { item: '<b>Mask</b>', from: 120000, sellerPrice: 100000, to: 99990, seller: 'Competitor', sellerUrl: 'https://gwars.io/info.php?id=1736883' },
    ] } : index === 1 ? { ok: false, error: 'Save could not be confirmed' } : { ok: true, changes: [] };
    receive({ type: 'realty-shop-bump-result', runId, result }, {}, vi.fn());
    await vi.advanceTimersByTimeAsync(0);
    expect(progress.textContent).toBe(`shops: ${index + 1}/12`);
    if (index < 11) {
      await vi.advanceTimersByTimeAsync(199);
      expect(send).toHaveBeenCalledTimes(index + 1);
      await vi.advanceTimersByTimeAsync(1);
      expect(send).toHaveBeenCalledTimes(index + 2);
      expect(itemProgress.textContent).toContain('Loading…');
      expect(itemProgress.textContent).not.toContain('3/7');
    }
  }
  const popup = document.querySelector('[data-test-shop-bump-results]');
  expect(send.mock.calls.map(([message]) => message.propertyId)).toEqual([
    '118340', '101661', '168229', '176354', '108288', '159930',
    '124487', '73749', '169998', '106277', '103702', '176113',
  ]);
  expect(popup.textContent).toContain('Магазин аксессуаров #118340');
  expect(popup.textContent).toContain('<b>Mask</b>');
  expect(popup.querySelector('b')).toBeNull();
  expect([...popup.querySelectorAll('th')].map((cell) => cell.textContent))
    .toEqual(['Item', 'Old price', "Seller's price", 'New price', 'Seller']);
  expect(popup.querySelector('h4 a').getAttribute('href')).toBe('/object.php?id=118340');
  expect(popup.querySelector('h4 a').target).toBe('_blank');
  expect([...popup.querySelectorAll('td')].map((cell) => cell.textContent))
    .toEqual(['<b>Mask</b>', '120000', '100000', '99990', 'Competitor']);
  expect(popup.querySelector('td a').href).toBe('https://www.gwars.io/info.php?id=1736883');
  expect(popup.querySelector('td a').target).toBe('_blank');
  expect(document.querySelector('[data-test-realty-seller-summary] tbody a').href)
    .toBe('https://www.gwars.io/info.php?id=1736883');
  expect(popup.textContent).toContain('Failed: Save could not be confirmed');
  expect(popup.textContent).toContain('No prices changed.');
  expect(button.disabled).toBe(false);
  fireEvent.click(getByRole(popup, 'button', { name: 'Close' }));
  expect(document.querySelector('[data-test-shop-bump-results]')).toBeNull();
});

test('tab-opening failures are recorded and the remaining shops still finish', async () => {
  send.mockResolvedValue({ ok: false, error: 'Could not open shop tab' });
  RealtyShopBump.init();
  fireEvent.click(getByRole(document.body, 'button', { name: 'bump shop prices' }));
  await vi.runAllTimersAsync();
  expect(send).toHaveBeenCalledTimes(12);
  expect(document.querySelector('[data-test-realty-shop-progress]').textContent).toBe('shops: 12/12');
  expect(document.querySelector('[data-test-shop-bump-results]').textContent).toContain('Failed: Could not open shop tab');
});

test('continuous mode runs immediately, repeats without overlap, logs results, counts runs, and stops', async () => {
  RealtyShopBump.init();
  const start = getByRole(document.body, 'button', { name: 'continuously bump' });
  const manual = getByRole(document.body, 'button', { name: 'bump shop prices' });
  const status = document.querySelector('[data-test-continuous-bump-status]');
  const counter = document.querySelector('[data-test-continuous-bump-count]');
  const countdown = document.querySelector('[data-test-continuous-bump-countdown]');
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  expect(status.textContent).toBe('Inactive');
  expect(counter.textContent).toBe('Runs: 0');
  expect(countdown.hidden).toBe(true);
  fireEvent.click(start);
  await vi.advanceTimersByTimeAsync(200);
  expect(send.mock.calls[0][0]).toEqual({ type: 'start-continuous-shop-bump', minutes: 5, nightTimeUpdate: true });
  expect(start.textContent).toBe('stop continuously bump');
  expect(start.classList.contains('realty-continuous-bump--running')).toBe(true);
  expect(counter.hidden).toBe(false);
  expect(status.textContent).toBe('Active · bumping');
  expect(manual.disabled).toBe(true);
  expect(countdown.textContent).toBe('Next run: 05:00');
  expect(countdown.hidden).toBe(false);
  await vi.advanceTimersByTimeAsync(1000);
  expect(countdown.textContent).toBe('Next run: 04:59');
  const openings = () => send.mock.calls.map(([message]) => message).filter((message) => message.type === 'open-shop-bump');
  const finishBatch = async (offset) => {
    for (let index = 0; index < 12; index++) {
      receive({ type: 'realty-shop-bump-result', runId: openings()[offset + index].runId,
        result: { ok: false, error: 'Save failed' } }, {}, vi.fn());
      await vi.advanceTimersByTimeAsync(0);
      if (index < 11) await vi.advanceTimersByTimeAsync(200);
    }
  };
  await finishBatch(0);
  expect(log).toHaveBeenCalledTimes(2);
  expect(log.mock.calls[0]).toEqual(['continuously bump results', { run: 1, results: expect.any(Array) }]);
  expect(log.mock.calls[1]).toEqual(['continuously bump seller summary', { run: 1, sellers: [] }]);
  expect(counter.textContent).toBe('Runs: 1');
  expect(status.textContent).toBe('Active · every 5 min');
  expect(start.classList.contains('realty-continuous-bump--running')).toBe(false);
  expect(document.querySelector('[data-test-shop-bump-results]')).toBeNull();
  receive({ type: 'continuous-shop-bump-tick' }, {}, vi.fn());
  expect(countdown.textContent).toBe('Next run: 05:00');
  await vi.advanceTimersByTimeAsync(200);
  expect(openings()).toHaveLength(13);
  expect(start.classList.contains('realty-continuous-bump--running')).toBe(true);
  receive({ type: 'continuous-shop-bump-tick' }, {}, vi.fn());
  await vi.advanceTimersByTimeAsync(1000);
  expect(openings()).toHaveLength(13);
  fireEvent.click(start);
  await vi.advanceTimersByTimeAsync(0);
  expect(send).toHaveBeenLastCalledWith({ type: 'stop-continuous-shop-bump' });
  const respond = vi.fn();
  receive({ type: 'continuous-shop-bump-tick' }, {}, respond);
  expect(respond).toHaveBeenCalledWith({ ok: false });
  await finishBatch(12);
  expect(counter.textContent).toBe('Runs: 2');
  expect(status.textContent).toBe('Inactive');
  expect(start.classList.contains('realty-continuous-bump--running')).toBe(false);
  expect(countdown.hidden).toBe(true);
  const panel = document.querySelector('[data-test-continuous-bump-panel]');
  expect([...panel.children].filter((element) => !element.hidden).map((element) => element.textContent))
    .toEqual(['Inactive']);
  expect(manual.disabled).toBe(false);
  expect(log).toHaveBeenCalledTimes(4);
  expect(log.mock.calls[3]).toEqual(['continuously bump seller summary', { run: 2, sellers: [] }]);
  expect(document.querySelector('[data-test-shop-bump-results]')).toBeNull();
});

test('unchanged shops skip one continuous iteration, retry after skipping, and reset on restart', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  send.mockImplementation(async (message) => {
    if (message.type === 'open-shop-bump') {
      const result = message.propertyId === '118340'
        ? { ok: true, changes: [{ seller: 'Competitor' }, { seller: 'Competitor' }] }
        : message.propertyId === '101661'
          ? { ok: false, error: 'Save failed' }
          : { ok: true, changes: [] };
      setTimeout(() => receive({ type: 'realty-shop-bump-result', runId: message.runId, result }, {}, vi.fn()), 0);
    }
    return { ok: true };
  });
  const openings = () => send.mock.calls.map(([message]) => message)
    .filter((message) => message.type === 'open-shop-bump').map((message) => message.propertyId);
  RealtyShopBump.init();
  const propertyTable = document.querySelector('[data-test-realty-property-summary]');
  const propertyDetails = propertyTable.closest('.realty-sellers-details');
  expect(propertyDetails.previousElementSibling.querySelector('[data-test-realty-seller-summary]')).not.toBeNull();
  expect(propertyTable.tBodies[0].hidden).toBe(true);
  fireEvent.click(propertyTable.querySelector('th button'));
  expect([...propertyTable.querySelectorAll('th')].map((cell) => cell.textContent))
    .toEqual(['property · 12', 'iterations · 0', 'updates · 0']);
  expect(propertyTable.tBodies[0].rows).toHaveLength(12);
  expect([...propertyTable.tBodies[0].rows].every((row) => row.cells[1].textContent === '0')).toBe(true);
  const toggle = getByRole(document.body, 'button', { name: 'continuously bump' });
  fireEvent.click(toggle);
  await vi.advanceTimersByTimeAsync(3000);
  const all = openings();
  expect(all).toHaveLength(12);
  fireEvent.click(propertyTable.querySelector('th button'));
  expect(propertyTable.tBodies[0].hidden).toBe(true);
  for (const expected of [all.slice(0, 2), all, all.slice(0, 2)]) {
    const before = openings().length;
    receive({ type: 'continuous-shop-bump-tick' }, {}, vi.fn());
    await vi.advanceTimersByTimeAsync(3000);
    expect(openings().slice(before)).toEqual(expected);
  }
  expect(document.querySelector('[data-test-realty-shop-progress]').textContent).toBe('shops: 12/12 (10 skipped)');
  const lastResults = log.mock.calls.filter(([label]) => label === 'continuously bump results').at(-1)[1].results;
  expect(lastResults.filter((result) => result.skipped)).toHaveLength(10);
  expect(document.querySelector('[data-test-continuous-bump-count]').textContent).toBe('Runs: 4');
  expect(propertyTable.tBodies[0].hidden).toBe(true);
  const firstProperty = propertyTable.tBodies[0].rows[0];
  expect(firstProperty.cells[0].textContent).toBe('Магазин аксессуаров #118340');
  expect(firstProperty.cells[1].textContent).toBe('4');
  expect(firstProperty.cells[2].textContent).toBe('4');
  expect([...propertyTable.tHead.rows[0].cells].map((cell) => cell.textContent))
    .toEqual(['property · 12', 'iterations · 24', 'updates · 4']);
  expect(firstProperty.querySelector('a').href).toBe('https://www.gwars.io/object.php?id=118340');
  expect(firstProperty.querySelector('a').target).toBe('_blank');
  expect([...propertyTable.tBodies[0].rows].map((row) => row.cells[1].textContent))
    .toEqual(['4', ...Array(10).fill('2'), '0']);
  expect(propertyTable.tBodies[0].rows[11].querySelector('a').getAttribute('href')).toBe('/object.php?id=101661');
  expect([...propertyTable.tBodies[0].rows].slice(1).every((row) => row.cells[2].textContent === '0')).toBe(true);
  fireEvent.click(toggle);
  await vi.advanceTimersByTimeAsync(0);
  const beforeManual = openings().length;
  fireEvent.click(getByRole(document.body, 'button', { name: 'bump shop prices' }));
  await vi.advanceTimersByTimeAsync(3000);
  expect(openings().slice(beforeManual)).toEqual(all);
  const beforeRestart = openings().length;
  fireEvent.click(toggle);
  await vi.advanceTimersByTimeAsync(3000);
  expect(openings().slice(beforeRestart)).toEqual(all);
  expect(propertyTable.tBodies[0].rows[0].cells[1].textContent).toBe('6');
  expect(propertyTable.tBodies[0].rows[0].cells[2].textContent).toBe('6');
});

test('property table counts every completed manual check even when no prices change', async () => {
  send.mockImplementation(async (message) => {
    if (message.type === 'open-shop-bump') {
      const result = { ok: true, changes: message.propertyId === '103702'
        ? [{ seller: 'A' }, { seller: 'B' }, { seller: 'A' }] : [] };
      setTimeout(() => receive({ type: 'realty-shop-bump-result', runId: message.runId, result }, {}, vi.fn()), 0);
    }
    return { ok: true };
  });
  RealtyShopBump.init();
  const table = document.querySelector('[data-test-realty-property-summary]');
  for (let run = 1; run <= 2; run++) {
    fireEvent.click(getByRole(document.body, 'button', { name: 'bump shop prices' }));
    await vi.advanceTimersByTimeAsync(3000);
    expect([...table.tBodies[0].rows].every((row) => row.cells[1].textContent === String(run))).toBe(true);
    expect([...table.tHead.rows[0].cells].map((cell) => cell.textContent))
      .toEqual(['property · 12', `iterations · ${12 * run}`, `updates · ${run}`]);
    for (const row of table.tBodies[0].rows) {
      expect(row.cells[2].textContent).toBe(row.querySelector('a').getAttribute('href') === '/object.php?id=103702' ? String(run) : '0');
    }
  }
});

test('an entirely unchanged run skips all shops once, then checks all shops again', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  send.mockImplementation(async (message) => {
    if (message.type === 'open-shop-bump') {
      setTimeout(() => receive({ type: 'realty-shop-bump-result', runId: message.runId,
        result: { ok: true, changes: [] } }, {}, vi.fn()), 0);
    }
    return { ok: true };
  });
  RealtyShopBump.init();
  fireEvent.click(getByRole(document.body, 'button', { name: 'continuously bump' }));
  await vi.advanceTimersByTimeAsync(3000);
  const table = document.querySelector('[data-test-realty-property-summary]');
  expect([...table.tBodies[0].rows].every((row) => row.cells[1].textContent === '1')).toBe(true);
  receive({ type: 'continuous-shop-bump-tick' }, {}, vi.fn());
  await vi.advanceTimersByTimeAsync(3000);
  expect(send.mock.calls.filter(([message]) => message.type === 'open-shop-bump')).toHaveLength(12);
  expect(document.querySelector('[data-test-continuous-bump-count]').textContent).toBe('Runs: 2');
  expect([...table.tBodies[0].rows].every((row) => row.cells[1].textContent === '1')).toBe(true);
  receive({ type: 'continuous-shop-bump-tick' }, {}, vi.fn());
  await vi.advanceTimersByTimeAsync(3000);
  expect(send.mock.calls.filter(([message]) => message.type === 'open-shop-bump')).toHaveLength(24);
  expect(document.querySelector('[data-test-continuous-bump-count]').textContent).toBe('Runs: 3');
  expect([...table.tBodies[0].rows].every((row) => row.cells[1].textContent === '2')).toBe(true);
});

test('night interval and boundary updates keep status and countdown in sync without extra runs', async () => {
  vi.setSystemTime(new Date(2026, 9, 4, 16));
  send.mockImplementation(async ({ type }) => type === 'open-shop-bump'
    ? { ok: false, error: 'Unavailable' } : { ok: true });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  RealtyShopBump.init();
  fireEvent.click(getByRole(document.body, 'button', { name: 'continuously bump' }));
  await vi.advanceTimersByTimeAsync(3000);
  const status = document.querySelector('[data-test-continuous-bump-status]');
  const countdown = document.querySelector('[data-test-continuous-bump-countdown]');
  expect(status.textContent).toBe('Active · every 10 min');
  expect(countdown.textContent).toBe('Next run: 09:57');
  vi.setSystemTime(new Date(2026, 9, 4, 21));
  receive({ type: 'continuous-shop-bump-schedule', nextRunAt: Date.now() + 300000 }, {}, vi.fn());
  expect(status.textContent).toBe('Active · every 5 min');
  expect(countdown.textContent).toBe('Next run: 05:00');
  expect(send.mock.calls.filter(([message]) => message.type === 'open-shop-bump')).toHaveLength(12);
  Settings.nightTimeUpdate = false;
  settingsChanged({ [STORAGE_KEY]: { newValue: { nightTimeUpdate: false } } }, 'local');
  await vi.advanceTimersByTimeAsync(0);
  expect(send).toHaveBeenLastCalledWith({ type: 'start-continuous-shop-bump', minutes: 5, nightTimeUpdate: false });
});

test('changing the saved interval rearms continuous mode without starting an extra batch', async () => {
  send.mockImplementation(async ({ type }) => type === 'open-shop-bump'
    ? { ok: false, error: 'Unavailable' } : { ok: true });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  RealtyShopBump.init();
  fireEvent.click(getByRole(document.body, 'button', { name: 'continuously bump' }));
  await vi.advanceTimersByTimeAsync(3000);
  Settings.shopBumpIntervalMinutes = 2;
  settingsChanged({ [STORAGE_KEY]: { newValue: { shopBumpIntervalMinutes: 2 } } }, 'local');
  await vi.advanceTimersByTimeAsync(0);
  expect(send).toHaveBeenLastCalledWith({ type: 'start-continuous-shop-bump', minutes: 2, nightTimeUpdate: true });
  expect(document.querySelector('[data-test-continuous-bump-status]').textContent).toBe('Active · every 2 min');
  expect(document.querySelector('[data-test-continuous-bump-countdown]').textContent).toBe('Next run: 02:00');
  expect(send.mock.calls.filter(([message]) => message.type === 'open-shop-bump')).toHaveLength(12);
});

test('countdown uses the worker schedule and catches up after an inactive tab resumes', async () => {
  const scheduledTime = Date.now() + 90000;
  send.mockResolvedValue({ ok: true, nextRunAt: scheduledTime });
  RealtyShopBump.init();
  fireEvent.click(getByRole(document.body, 'button', { name: 'continuously bump' }));
  await vi.advanceTimersByTimeAsync(0);
  const countdown = document.querySelector('[data-test-continuous-bump-countdown]');
  expect(countdown.textContent).toBe('Next run: 01:30');
  vi.setSystemTime(scheduledTime - 20000);
  document.dispatchEvent(new Event('visibilitychange'));
  expect(countdown.textContent).toBe('Next run: 00:20');
  vi.setSystemTime(scheduledTime + 10000);
  document.dispatchEvent(new Event('visibilitychange'));
  expect(countdown.textContent).toBe('Next run: 00:00');
});

test('seller summary counts confirmed updates across shops and excludes failed saves', () => {
  expect(RealtyShopBump.sellerSummary([
    { ok: true, changes: [{ seller: 'Seller A' }, { seller: 'Seller B' }] },
    { ok: true, changes: [{ seller: 'Seller A' }, { seller: null }] },
    { ok: false, changes: [{ seller: 'Seller B' }] },
    { ok: true, changes: [] },
  ])).toEqual([
    { seller: 'Seller A', updatedItems: 2 },
    { seller: 'Seller B', updatedItems: 1 },
    { seller: 'No offers', updatedItems: 1 },
  ]);
});

test('seller table counts each seller once per run, totals changed items, sorts, and links profiles', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  let opened = 0;
  const changes = (seller, count, sellerUrl) => Array.from({ length: count }, () => ({ seller, sellerUrl }));
  send.mockImplementation(async (message) => {
    if (message.type === 'open-shop-bump') {
      const round = Math.floor(opened / 12);
      const shop = opened++ % 12;
      let result = { ok: true, changes: [] };
      if (round === 0 && shop === 0) result.changes = [
        ...changes('Seller A', 2, '/info.php?id=321'), ...changes('Seller B', 1, '/info.php?id=654'),
      ];
      if (round === 0 && shop === 1) result.changes = changes('Seller A', 1, '/info.php?id=321');
      if (round === 0 && shop === 3) result.changes = changes(null, 1, null);
      if (round === 1 && shop === 0) result.changes = changes('Seller B', 4, '/info.php?id=654');
      if (round === 1 && shop === 1) result.changes = changes('Seller A', 1, '/info.php?id=321');
      if (round === 1 && shop === 2) result = { ok: false, changes: changes('Failed seller', 9, '/info.php?id=999') };
      setTimeout(() => receive({ type: 'realty-shop-bump-result', runId: message.runId, result }, {}, vi.fn()), 0);
    }
    return { ok: true };
  });
  RealtyShopBump.init();
  const table = document.querySelector('[data-test-realty-seller-summary]');
  const details = table.closest('.realty-sellers-details');
  expect(details.parentElement.className).toBe('realty-bump-tables');
  expect(table.tBodies[0].hidden).toBe(true);
  fireEvent.click(table.querySelector('th button'));
  expect([...table.querySelectorAll('th')].map((cell) => cell.textContent))
    .toEqual(['seller · 0', 'iterations · 0', 'items · 0']);
  fireEvent.click(getByRole(document.body, 'button', { name: 'continuously bump' }));
  await vi.advanceTimersByTimeAsync(3000);
  expect([...table.tBodies[0].rows[0].cells].map((cell) => cell.textContent)).toEqual(['Seller A', '1', '3']);
  expect(table.tHead.rows[0].cells[0].textContent).toBe('seller · 3');
  expect([...table.tHead.rows[0].cells].map((cell) => cell.textContent))
    .toEqual(['seller · 3', 'iterations · 3', 'items · 5']);
  fireEvent.click(table.querySelector('th button'));
  expect(table.tBodies[0].hidden).toBe(true);
  receive({ type: 'continuous-shop-bump-tick' }, {}, vi.fn());
  await vi.advanceTimersByTimeAsync(3000);
  expect(table.tBodies[0].hidden).toBe(true);
  fireEvent.click(table.querySelector('th button'));
  expect(table.tBodies[0].hidden).toBe(false);
  expect([...table.tHead.rows[0].cells].map((cell) => cell.textContent))
    .toEqual(['seller · 3', 'iterations · 5', 'items · 10']);
  expect([...table.tBodies[0].rows].map((row) => [...row.cells].map((cell) => cell.textContent))).toEqual([
    ['Seller B', '2', '5'], ['Seller A', '2', '4'], ['No offers', '1', '1'],
  ]);
  const link = getByRole(table, 'link', { name: 'Seller B' });
  expect(link.href).toBe('https://www.gwars.io/info.php?id=654');
  expect(link.target).toBe('_blank');
  expect(table.tBodies[0].rows[2].querySelector('a')).toBeNull();
  expect(document.querySelectorAll('[data-test-realty-seller-summary]')).toHaveLength(1);
});

test('total continuous time includes waiting, pauses when stopped, and accumulates after restarting', async () => {
  send.mockImplementation(async ({ type }) => type === 'open-shop-bump'
    ? { ok: false, error: 'Unavailable' } : { ok: true });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  RealtyShopBump.init();
  const elapsed = document.querySelector('[data-test-continuous-bump-elapsed]');
  const started = document.querySelector('[data-test-continuous-bump-started]');
  const toggle = getByRole(document.body, 'button', { name: 'continuously bump' });
  expect(elapsed.textContent).toBe('Total time: 00:00');
  expect(started.hidden).toBe(true);
  const clickedAt = new Date();
  fireEvent.click(toggle);
  await vi.advanceTimersByTimeAsync(61000);
  expect(document.querySelector('[data-test-continuous-bump-status]').textContent).toBe('Active · every 5 min');
  expect(elapsed.textContent).toBe('Total time: 00:01');
  expect(started.hidden).toBe(false);
  expect(started.dateTime).toBe(clickedAt.toISOString());
  expect(started.textContent).toBe(`Started: ${clickedAt.toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })}`);
  fireEvent.click(toggle);
  await vi.advanceTimersByTimeAsync(30000);
  expect(elapsed.textContent).toBe('Total time: 00:01');
  expect(started.dateTime).toBe(clickedAt.toISOString());
  const restartedAt = new Date();
  fireEvent.click(toggle);
  await vi.advanceTimersByTimeAsync(1000);
  expect(elapsed.textContent).toBe('Total time: 00:01');
  expect(started.dateTime).toBe(restartedAt.toISOString());
  Settings.shopBumpIntervalMinutes = 2;
  settingsChanged({ [STORAGE_KEY]: { newValue: { shopBumpIntervalMinutes: 2 } } }, 'local');
  await vi.advanceTimersByTimeAsync(0);
  expect(elapsed.textContent).toBe('Total time: 00:01');
});

test('a scheduled run waits until the final shop save result completes the previous full batch', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  RealtyShopBump.init();
  fireEvent.click(getByRole(document.body, 'button', { name: 'continuously bump' }));
  await vi.advanceTimersByTimeAsync(200);
  const openings = () => send.mock.calls.map(([message]) => message).filter((message) => message.type === 'open-shop-bump');
  for (let index = 0; index < 11; index++) {
    receive({ type: 'realty-shop-bump-result', runId: openings()[index].runId,
      result: { ok: false, error: 'Save failed' } }, {}, vi.fn());
    await vi.advanceTimersByTimeAsync(200);
  }
  expect(openings()).toHaveLength(12);
  expect(document.querySelector('[data-test-realty-shop-progress]').textContent).toBe('shops: 11/12');
  receive({ type: 'continuous-shop-bump-tick' }, {}, vi.fn());
  await vi.advanceTimersByTimeAsync(1000);
  expect(openings()).toHaveLength(12);
  expect(document.querySelector('[data-test-continuous-bump-count]').textContent).toBe('Runs: 0');
  receive({ type: 'realty-shop-bump-result', runId: openings()[11].runId,
    result: { ok: false, error: 'Save failed' } }, {}, vi.fn());
  await vi.advanceTimersByTimeAsync(0);
  expect(document.querySelector('[data-test-continuous-bump-count]').textContent).toBe('Runs: 1');
  receive({ type: 'continuous-shop-bump-tick' }, {}, vi.fn());
  await vi.advanceTimersByTimeAsync(200);
  expect(openings()).toHaveLength(13);
});
