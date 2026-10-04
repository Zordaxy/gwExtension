import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';

vi.mock('js/app', () => ({ App: {} }));
vi.mock('js/storage', () => ({ Storage: {
  getItems: vi.fn(), hasItem: () => false, getPropertyResources: () => ({}),
  getCost: (id) => ({ hkmg36: 350760, available: 100, unavailable: 999999 })[id],
} }));
vi.mock('data/ordinal', () => ({ Ordinal: { getGroupedElements: () => ({
  Weapons: [{ id: 'hkmg36' }], Other: [{ id: 'available' }, { id: 'unavailable' }],
}) } }));
vi.mock('js/settings', () => ({ Settings: { domain: 'https://www.gwars.io' } }));

import { App } from 'js/app';
import { Http } from 'js/http';
import { Parse } from 'js/parsers';
import { Result } from 'js/widgets/result';
import { Statistics } from 'js/features/statistics';

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<a href="/object.php?id=1">ДІМ</a><a href="/object.php?id=2">ДІМ</a>';
  App.blacker = { show: vi.fn(), hide: vi.fn() };
  App.result = new Result(App.blacker);
  vi.spyOn(Parse, 'parseIsland').mockReturnValue('G');
  vi.spyOn(Parse, 'shopPriceFromShopsList').mockImplementation((doc) => ({
    title: doc.documentElement.dataset.item, G: {
      minPrice: doc.documentElement.dataset.item === 'hkmg36' ? 400000 : 200,
      isNoOffers: doc.documentElement.dataset.item === 'available',
    },
  }));
  vi.spyOn(Parse, 'gosPrice').mockReturnValue(200);
  vi.spyOn(Parse, 'resourcePrice').mockReturnValue(100);
  vi.spyOn(Http, 'fetchGet').mockImplementation(async (url) => {
    const doc = new DOMParser().parseFromString('<html><body></body></html>', 'text/html');
    if (url.includes('/object.php')) {
      const quantity = url.endsWith('id=1') ? 10 : 5;
      doc.body.innerHTML = `<table><tr><td>HK MG-36<input name="resource" value="hkmg36"></td><td>${quantity}</td></tr>
        <tr><td>Other<input name="resource" value="available"></td><td>1</td></tr></table>`;
    } else doc.documentElement.dataset.item = new URL(url, location.origin).searchParams.get('r');
    return doc;
  });
});
afterEach(() => vi.useRealTimers());

test('weights both price columns by stock across houses, includes fallback offers, and keeps totals visible', async () => {
  const statistics = new Statistics();
  const run = statistics.findStatistic();
  await vi.runAllTimersAsync();
  await run;
  const table = App.result.content.closest('table');
  const total = table.querySelector('[data-test-statistics-totals]');
  expect(total.parentElement).toBe(table.tFoot);
  expect([...total.cells].map((cell) => cell.textContent))
    .toEqual(['', 'Разом', '6,000,400', '5,261,600', '', '', '', '17', '']);
  const lastSection = [...table.querySelectorAll('.section-toggle')].at(-1);
  fireEvent.click(lastSection);
  expect(total.classList.contains('is-hidden')).toBe(false);
  const repeated = statistics.findStatistic();
  await vi.runAllTimersAsync();
  await repeated;
  expect(table.querySelectorAll('[data-test-statistics-totals]')).toHaveLength(1);
  expect(table.tFoot.rows[0].cells[7].textContent).toBe('17');
});

test('no stored items produces zero quantity and zero weighted prices', async () => {
  document.querySelectorAll('a[href*="object.php"]').forEach((link) => link.remove());
  const run = new Statistics().findStatistic();
  await vi.runAllTimersAsync();
  await run;
  const cells = document.querySelector('[data-test-statistics-totals]').cells;
  expect([cells[2].textContent, cells[3].textContent, cells[7].textContent]).toEqual(['0', '0', '0']);
});
