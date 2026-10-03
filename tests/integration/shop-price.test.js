import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fireEvent } from "@testing-library/dom";

vi.mock("js/settings", () => ({ Settings: {
  showButtons: { countShop: true },
  friends: [],
  requiredProfit: { below60000: 10000, from60000To99999: 10000,
    from100000To199999: 10000, from200000To299999: 10000, from300000: 10000 },
} }));
vi.mock("js/storage", () => ({ Storage: {
  getCost: vi.fn(() => 0),
  getShopProfitOverrides: () => ({}),
  setShopProfitOverride: vi.fn(),
} }));
vi.mock("js/app", () => ({ App: {} }));

import { Search } from "js/search";
import { Parse } from "js/parsers";
import { Http } from "js/http";
import { Storage } from "js/storage";

function marketPage() {
  const html = fs.readFileSync(path.resolve(__dirname,
    "../fixtures/pages/market-no-offers.html"), "utf8");
  const doc = new DOMParser().parseFromString(html, "text/html");
  // jsdom doesn't implement innerText, used by the existing gos parser.
  doc.querySelectorAll("b").forEach((b) => {
    Object.defineProperty(b, "innerText", { get: () => b.textContent });
  });
  return doc;
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = `<form action='/objectedit.php'>
    <input name='id' value='100001'>
    <table cellpadding='4'><tbody>
      <tr><td>Цена продажи</td></tr>
      <tr><td><input name='priceb[ulr338]' value='0'></td><td>1</td>
        <td><input value='1'></td><td><input value='12345'></td></tr>
    </tbody></table></form>`;
  Search.controls = null;
  document.querySelectorAll("td").forEach((td) => {
    Object.defineProperty(td, "innerText", { get: () => td.textContent });
  });
  vi.spyOn(Parse, "parseIsland").mockReturnValue("G");
  vi.mocked(Storage.getCost).mockReturnValue(0);
});

afterEach(() => vi.useRealTimers());

test("captured market page distinguishes base, private shop, and delivery prices", () => {
  const doc = marketPage();
  expect(doc.body.textContent).toContain("предложений других игроков не найдено");
  expect(Parse.basePrice(doc)).toBe(210000);
  expect(Parse.gosPrice(doc)).toBe(293760);
});

test.each(["<table><tr><td class='greengreenbg'>Нет цены</td></tr></table>",
  "<table><tr><td class='greengreenbg'>Базовая цена: <b>unknown</b></td></tr></table>"])
  ("missing or invalid base price doesn't become zero", (html) => {
    expect(Parse.basePrice(new DOMParser().parseFromString(html, "text/html")))
      .toBeUndefined();
  });

test.each([
  [210000, 0, 272000],
  [66548, 0, 85000],
  [66548, 80000, 85000],
])("no offers: base %s, cost %s recommends %s through every control", async (base, cost, expected) => {
  const doc = marketPage();
  [...doc.querySelectorAll("td.greengreenbg b")].find((b) =>
    b.previousSibling?.textContent.includes("Базовая цена:")
  ).textContent = `${base}$`;
  vi.mocked(Storage.getCost).mockReturnValue(cost);
  vi.spyOn(Parse, "shopPriceFromShopsList").mockReturnValue({
    G: { minPrice: null, seller: null, isNoOffers: true },
  });
  const fetch = vi.spyOn(Http, "fetchGet")
    .mockResolvedValueOnce(document).mockResolvedValueOnce(doc);
  Search.init();
  const pending = Search.findShopPrices();
  await vi.runAllTimersAsync();
  await pending;
  expect(Search.controls.countCheck.style.visibility).toBe("visible");
  expect(Search.controls.applyAll.disabled).toBe(false);
  expect(document.activeElement).toBe(Search.controls.applyAll);
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([
    "/statlist.php?r=ulr338&type=i", "/market.php?buy=1&item_id=ulr338",
  ]);
  const cell = document.querySelector("[data-test-edit-price-in-property]");
  expect(cell.querySelector("span").textContent).toBe(String(expected));
  expect(cell.dataset.expected).toBe(String(expected));
  const input = cell.closest("tr").querySelectorAll("td input")[2];
  fireEvent.click(cell);
  expect(input.value).toBe(String(expected));
  input.value = "1";
  fireEvent.click([...document.querySelectorAll("button")].find((b) => b.textContent === "apply all"));
  expect(input.value).toBe(String(expected));
  const checkbox = document.querySelector("[data-test-ignore-profit-treshold]");
  fireEvent.click(checkbox);
  expect(input.value).toBe(String(expected));
});

test("eligible shop offers use only statlist and keep normal undercutting", async () => {
  vi.spyOn(Parse, "shopPriceFromShopsList").mockReturnValue({
    G: { minPrice: 100000, seller: "Competitor", isNoOffers: false },
  });
  const fetch = vi.spyOn(Http, "fetchGet").mockResolvedValue(document);
  Search.init();
  const pending = Search.findShopPrices();
  await vi.runAllTimersAsync();
  await pending;
  expect(fetch).toHaveBeenCalledExactlyOnceWith("/statlist.php?r=ulr338&type=i");
  expect(document.querySelector("[data-test-edit-price-in-property]").dataset.expected)
    .toBe("99990");
});
