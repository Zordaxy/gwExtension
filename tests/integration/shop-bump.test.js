import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, getByRole } from '@testing-library/dom';
import { loadPage } from '../helpers/loadPage';

vi.mock('js/settings', () => ({ Settings: {
  showButtons: { countShop: true }, friends: [],
  requiredProfit: { below60000: 10000, from60000To99999: 10000,
    from100000To199999: 10000, from200000To299999: 10000, from300000: 10000 },
} }));
vi.mock('js/storage', () => ({ Storage: {
  getCost: vi.fn(() => 0), getShopProfitOverrides: vi.fn(() => ({})),
} }));
vi.mock('js/app', () => ({ App: {} }));
vi.mock('js/scroll', () => ({ Scroll: { toElement: vi.fn() } }));

import { Search } from 'js/search';
import { Parse } from 'js/parsers';
import { Http } from 'js/http';
import { AddLine } from 'js/addLine';
import { Scroll } from 'js/scroll';
import { Storage } from 'js/storage';
import { ShopBump } from 'js/shopBump';
import { ShopBumpBridge } from 'js/shopBumpBridge';

function setup(savedValues = []) {
  loadPage('property-edit-accessories');
  document.querySelectorAll('td').forEach((td) =>
    Object.defineProperty(td, 'innerText', { get: () => td.textContent }));
  savedValues.forEach(([name, value]) => {
    document.querySelector('input[value="Сохранить настройки магазина"]').form.elements.namedItem(name).value = value;
  });
  Search.controls = null;
  Search.init();
  const save = getByRole(document.body, 'button', { name: 'Сохранить настройки магазина' });
  const submit = vi.fn((event) => event.preventDefault());
  save.form.addEventListener('submit', submit);
  return { save, submit, button: getByRole(document.body, 'button', { name: 'bump prices' }),
    check: document.querySelector('[data-test-bump-prices-complete]') };
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  ShopBump.onProgress = null;
  Storage.getCost.mockReturnValue(0);
  Storage.getShopProfitOverrides.mockReturnValue({});
  vi.spyOn(Parse, 'parseIsland').mockReturnValue('G');
  vi.spyOn(Parse, 'shopPriceFromShopsList').mockReturnValue({
    G: { minPrice: 100000, seller: 'Competitor', isNoOffers: false },
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('places a non-submit bump button and left check beside the captured money heading', () => {
  const { button, check } = setup();
  expect(button.type).toBe('button');
  expect(button.hasAttribute('data-test-bump-prices')).toBe(true);
  expect(button.previousElementSibling).toBe(check);
  expect(button.parentElement.textContent).toContain('Управление счетом');
  expect(check.style.visibility).toBe('hidden');
  expect(Search.controls.countButton.hasAttribute('data-test-count-ship')).toBe(true);
  expect(Search.controls.table.querySelector('input[name="pricem[sme45]"]')).not.toBeNull();
  const progress = document.querySelector('[data-test-bump-prices-progress]');
  expect(button.nextElementSibling).toBe(progress);
  expect(progress.hidden).toBe(true);
});

test('waits for all prices, applies once, saves once, then confirms and logs changes after reload', async () => {
  const { button, check, submit, save } = setup();
  let resolveFirst;
  const times = [];
  const fetch = vi.spyOn(Http, 'fetchGet').mockImplementation(() => {
    times.push(Date.now());
    if (times.length === 1) return new Promise((resolve) => { resolveFirst = resolve; });
    return Promise.resolve(document);
  });
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const countHandler = vi.fn(Search.controls.countButton.onclick);
  const applyHandler = vi.fn(Search.controls.applyAll.onclick);
  Search.controls.countButton.onclick = countHandler;
  Search.controls.applyAll.onclick = applyHandler;
  const countClick = vi.spyOn(Search.controls.countButton, 'click');
  const applyClick = vi.spyOn(Search.controls.applyAll, 'click');
  const saveClick = vi.spyOn(save, 'click');
  const append = vi.spyOn(AddLine, 'appendShopCount');
  const focus = vi.spyOn(HTMLElement.prototype, 'focus');
  const unchanged = document.querySelector('input[name="pricep[carryingvest]"]');
  unchanged.value = '99998';
  const expected = [...Search.controls.table.rows].filter((row) =>
    row.querySelector('input[name^="pricem["]') && Number(row.cells[1].textContent) > 0
  ).map((row) => {
    const input = row.querySelector('input[name^="pricep["]');
    return { item: row.cells[0].textContent.trim(), itemId: input.name.slice(7, -1),
      from: Number(input.value), sellerPrice: 100000, to: 99998, seller: 'Competitor', sellerUrl: null };
  }).filter(({ from, to }) => from !== to);

  fireEvent.click(button);
  fireEvent.click(button);
  await vi.advanceTimersByTimeAsync(1000);
  expect(countHandler).toHaveBeenCalledOnce();
  expect(countHandler).toHaveBeenCalledWith({ render: false, scroll: false });
  expect(applyHandler).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
  expect(check.style.visibility).toBe('hidden');
  const total = [...Search.controls.table.rows].filter((row) =>
    row.querySelector('input[name^="pricem["]') && Number(row.cells[1].textContent) > 0
  ).length;
  const progress = document.querySelector('[data-test-bump-prices-progress]');
  const bar = getByRole(document.body, 'progressbar', { name: 'Shop items checked' });
  expect(progress.hidden).toBe(false);
  expect(progress.textContent).toBe(`0/${total}`);
  expect(bar.max).toBe(total);
  expect(bar.value).toBe(0);
  resolveFirst(document);
  await vi.advanceTimersByTimeAsync(0);
  expect(progress.textContent).toBe(`1/${total}`);
  expect(bar.value).toBe(1);
  await vi.runAllTimersAsync();
  expect(progress.textContent).toBe(`${total}/${total}`);
  expect(bar.value).toBe(total);
  expect(fetch.mock.calls.length).toBeGreaterThan(1);
  expect(times.slice(1).every((time, index) => time - times[index] >= 200)).toBe(true);
  expect(Date.now() - times.at(-1)).toBeGreaterThanOrEqual(200);
  expect(applyHandler).toHaveBeenCalledOnce();
  expect(applyHandler).toHaveBeenCalledWith({ recommendations: Search.controls.recommendations, scroll: false });
  expect(append).not.toHaveBeenCalled();
  expect(document.querySelector('[data-test-edit-price-in-property]')).toBeNull();
  expect(Scroll.toElement).not.toHaveBeenCalled();
  expect(focus).not.toHaveBeenCalled();
  expect(countClick).not.toHaveBeenCalled();
  expect(applyClick).not.toHaveBeenCalled();
  expect(saveClick).toHaveBeenCalledOnce();
  expect(submit).toHaveBeenCalledOnce();
  expect(check.style.visibility).toBe('hidden');
  expect(log).not.toHaveBeenCalled();
  const savedValues = [...save.form.querySelectorAll('input[name^="pricep["]')]
    .map((input) => [input.name, input.value]);

  setup(savedValues);
  expect(document.querySelector('[data-test-bump-prices-complete]').style.visibility).toBe('visible');
  expect(document.querySelector('[data-test-bump-prices-progress]').textContent).toBe(`${total}/${total}`);
  expect(log).toHaveBeenCalledExactlyOnceWith('bump prices: changed items', expected);
  expect(sessionStorage.getItem('gw-bump-prices:118340')).toBeNull();
});

test.each([false, true])('unchanged shop finishes without save or pending storage (empty shop: %s)', async (empty) => {
  const { button, check, submit, save } = setup();
  for (const row of Search.controls.table.rows) {
    const input = row.querySelector('input[name^="pricep["]');
    if (input) input.value = '99998';
    if (empty && row.querySelector('input[name^="pricem["]')) row.cells[1].textContent = '0';
  }
  const fetch = vi.spyOn(Http, 'fetchGet').mockResolvedValue(document);
  const saveClick = vi.spyOn(save, 'click');
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const pending = button.onclick();
  await vi.runAllTimersAsync();
  expect(await pending).toEqual({ ok: true, changes: [] });
  expect(ShopBump.lastResult).toEqual({ ok: true, changes: [] });
  expect(saveClick).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
  expect(sessionStorage.length).toBe(0);
  expect(check.style.visibility).toBe('visible');
  expect(button.disabled).toBe(false);
  expect(log).toHaveBeenCalledExactlyOnceWith('bump prices: changed items', []);
  if (empty) expect(fetch).not.toHaveBeenCalled();
  else expect(fetch).toHaveBeenCalled();
});

test('bridge reports an unchanged shop immediately without waiting for a save reload', async () => {
  const { button } = setup();
  let receive;
  const send = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('chrome', { runtime: { sendMessage: send,
    onMessage: { addListener: (callback) => { receive = callback; } },
  } });
  button.onclick = vi.fn().mockResolvedValue({ ok: true, changes: [] });
  ShopBumpBridge.init();
  receive({ type: 'run-shop-bump' }, {}, vi.fn());
  await vi.advanceTimersByTimeAsync(200);
  expect(send).toHaveBeenLastCalledWith({ type: 'shop-bump-ready',
    propertyId: '118340', available: true, result: { ok: true, changes: [] } });
});

test('failed price lookup never applies or saves and allows retry', async () => {
  const { button, check, submit } = setup();
  vi.spyOn(Http, 'fetchGet').mockRejectedValueOnce(new Error('network failed'))
    .mockResolvedValue(document);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const apply = vi.fn(Search.controls.applyAll.onclick);
  Search.controls.applyAll.onclick = apply;
  fireEvent.click(button);
  await vi.runAllTimersAsync();
  expect(apply).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
  expect(check.style.visibility).toBe('hidden');
  expect(button.disabled).toBe(false);
  expect(Search.controls.countButton.disabled).toBe(false);
  expect(sessionStorage.length).toBe(0);
  fireEvent.click(button);
  await vi.runAllTimersAsync();
  expect(submit).toHaveBeenCalledOnce();
});

test('joins an already running countShop request without starting another run', async () => {
  const { button, submit } = setup();
  let resolveFirst;
  let calls = 0;
  vi.spyOn(Http, 'fetchGet').mockImplementation(() => {
    calls++;
    return calls === 1 ? new Promise((resolve) => { resolveFirst = resolve; })
      : Promise.resolve(document);
  });
  const count = vi.spyOn(Search.controls.countButton, 'click');
  Search.controls.countButton.click();
  fireEvent.click(button);
  expect(count).toHaveBeenCalledOnce();
  expect(submit).not.toHaveBeenCalled();
  resolveFirst(document);
  await vi.runAllTimersAsync();
  expect(submit).toHaveBeenCalledOnce();
});

test('does not show completion or log changed items if the save returned unchanged prices', () => {
  sessionStorage.setItem('gw-bump-prices:118340', JSON.stringify({
    prices: [{ name: 'pricep[carryingvest]', value: '99998' }],
    changes: [{ itemId: 'carryingvest', from: 91975, to: 99998, seller: 'Competitor' }],
  }));
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { check, button } = setup();
  expect(check.style.visibility).toBe('hidden');
  expect(button.disabled).toBe(false);
  expect(log).not.toHaveBeenCalled();
  expect(error).toHaveBeenCalledOnce();
  expect(sessionStorage.length).toBe(0);
});

test('manual countShop still renders recommendations, scrolls, and supports apply all', async () => {
  const { submit, save } = setup();
  vi.spyOn(Http, 'fetchGet').mockResolvedValue(document);
  fireEvent.click(Search.controls.countButton);
  expect(Scroll.toElement).toHaveBeenCalledWith(Search.controls.countButton, 0.1);
  await vi.runAllTimersAsync();
  const cells = [...document.querySelectorAll('[data-test-edit-price-in-property]')];
  expect(document.querySelector('[data-test-bump-prices-progress]').hidden).toBe(true);
  expect(cells.length).toBeGreaterThan(0);
  expect(document.activeElement).toBe(Search.controls.applyAll);
  expect(Search.controls.applyAll.disabled).toBe(false);
  cells[0].dataset.expected = '123456';
  fireEvent.click(Search.controls.applyAll);
  expect(cells[0].closest('tr').querySelectorAll('td input')[2].value).toBe('123456');
  expect(Scroll.toElement).toHaveBeenLastCalledWith(save, 0.9, expect.any(Function), 'bottom');
  expect(submit).not.toHaveBeenCalled();
});

test.each([[false, 190000], [true, 99998]])(
  'silent bump respects profit override %s and recommends %s', async (ignoreProfit, expected) => {
    const { button, submit } = setup();
    Storage.getCost.mockReturnValue(95000);
    Storage.getShopProfitOverrides.mockReturnValue({ 118340: { carryingvest: ignoreProfit } });
    vi.spyOn(Http, 'fetchGet').mockResolvedValue(document);
    fireEvent.click(button);
    await vi.runAllTimersAsync();
    expect(document.querySelector('input[name="pricep[carryingvest]"]').value).toBe(String(expected));
    expect(document.querySelector('[data-test-edit-price-in-property]')).toBeNull();
    expect(submit).toHaveBeenCalledOnce();
  }
);

test.each([true, false])('background bridge uses the existing bump handler and reports failure %s', async (ok) => {
  const { button } = setup();
  let receive;
  const send = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('chrome', { runtime: { sendMessage: send,
    onMessage: { addListener: (callback) => { receive = callback; } },
  } });
  const handler = vi.fn().mockResolvedValue(ok ? { ok: true, saving: true } : { ok: false, error: 'Lookup failed' });
  button.onclick = handler;
  const click = vi.spyOn(button, 'click');
  ShopBumpBridge.init();
  expect(send).toHaveBeenCalledExactlyOnceWith({ type: 'shop-bump-ready', propertyId: '118340', available: true, result: null });
  ShopBump.onProgress({ checked: 3, total: 7 });
  expect(send).toHaveBeenLastCalledWith({ type: 'shop-bump-progress', propertyId: '118340', progress: { checked: 3, total: 7 } });
  const respond = vi.fn();
  receive({ type: 'run-shop-bump' }, {}, respond);
  expect(respond).toHaveBeenCalledWith({ ok: true });
  await vi.advanceTimersByTimeAsync(199);
  expect(handler).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(handler).toHaveBeenCalledOnce();
  expect(click).not.toHaveBeenCalled();
  if (!ok) expect(send).toHaveBeenLastCalledWith({ type: 'shop-bump-failed', error: 'Lookup failed' });
});

test('bridge reports the confirmed save result on the returned page', () => {
  setup();
  const send = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('chrome', { runtime: { sendMessage: send, onMessage: { addListener: vi.fn() } } });
  ShopBump.lastResult = { ok: true, changes: [{ item: 'Mask', from: 120000, to: 99998, seller: 'Competitor' }] };
  ShopBumpBridge.init();
  expect(send).toHaveBeenCalledWith({ type: 'shop-bump-ready', propertyId: '118340', available: true, result: ShopBump.lastResult });
});

test('change report preserves the raw fallback offer price before applying the base-price limit', async () => {
  const { button } = setup();
  vi.spyOn(Http, 'fetchGet').mockResolvedValue(document);
  Parse.shopPriceFromShopsList.mockReturnValue({
    G: { minPrice: null, seller: null, isNoOffers: true },
  });
  vi.spyOn(Parse, 'gosPrice').mockReturnValue(293760);
  vi.spyOn(Parse, 'basePrice').mockReturnValue(210000);
  fireEvent.click(button);
  await vi.runAllTimersAsync();
  const pending = JSON.parse(sessionStorage.getItem('gw-bump-prices:118340'));
  expect(pending.changes.length).toBeGreaterThan(0);
  expect(pending.changes.every(({ sellerPrice, to }) => sellerPrice === 293760 && to === 272000)).toBe(true);
});
