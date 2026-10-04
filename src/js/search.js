import { Http } from "./http";
import { Parse } from "./parsers";
import { Fetcher } from "./fetchers";
import { AddLine } from "./addLine";
import { Settings } from "./settings";
import { ShopBump } from "./shopBump";

export const Search = {
  // Build the shop-table controls (countShop + apply all) up front, so the
  // "countShop" trigger lives next to "apply all" instead of in the nav bar.
  init() {
    if (!Settings.showButtons.countShop) {
      return;
    }
    const table = [...document.querySelectorAll(
      "form[action='/objectedit.php'] table[cellpadding='4']"
    )].find((table) => [...table.rows].some((row) =>
      row.textContent.includes("Цена продажи")));
    if (!table) {
      return;
    }
    // null on non-shop tables (no "Цена продажи" header).
    this.controls = AddLine.buildShopControls(table, (options) => this.findShopPrices(options));
    if (this.controls) {
      this.controls.table = table;
      ShopBump.init(table, this.controls);
    }
  },

  async findShopPrices({ render = true, scroll = true } = {}) {
    if (!this.controls) {
      return;
    }
    const island = Parse.parseIsland();
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const table = this.controls.table;
    table.querySelectorAll('[data-test-edit-price-in-property]').forEach((cell) => {
      cell.nextElementSibling?.remove();
      cell.remove();
    });
    this.controls.countCheck.style.visibility = "hidden";
    this.controls.applyAll.disabled = true;
    this.controls.recommendations = [];
    const recommendations = [];
    let rows = table.rows;
    let filteredRows = Array.prototype.filter.call(rows, (elem) => {
      const count = +elem.querySelectorAll("td")[1]?.innerText;
      const resourceId = elem
        .querySelectorAll("td input[name]")?.[0]
        ?.name?.slice(7, -1);
      return count !== 0 && resourceId && !isNaN(count);
    });
    const reportProgress = (checked) => {
      this.controls.progress = { checked, total: filteredRows.length };
      this.controls.onProgress?.(this.controls.progress);
    };
    reportProgress(0);

    await Http.processWithDelay(filteredRows, async (row) => {
      let inputPriceLine = row.querySelectorAll("td input[name]");
      let resourceId = inputPriceLine[0].name.slice(7, -1);

      const shopsDoc = await Fetcher.shopsList(resourceId);
      const parsedShops = Parse.shopPriceFromShopsList(shopsDoc);
      const localData = parsedShops[island];
      if (!localData) {
        throw new Error(`No shop price data for ${resourceId}`);
      }

      if (localData?.isNoOffers) {
        await delay(200);
        const marketDoc = await Fetcher.adverticementsList(resourceId);
        localData.minPrice = Parse.gosPrice(marketDoc);
        const basePrice = Parse.basePrice(marketDoc);
        if (basePrice !== undefined) {
          localData.maxAllowedPrice = basePrice * 1.3;
        }
      }
      if (!Number.isFinite(Number(localData.minPrice)) || Number(localData.minPrice) <= 0) {
        throw new Error(`Invalid shop price for ${resourceId}`);
      }
      const recommendation = AddLine.shopRecommendation(localData, resourceId,
        table.closest('form')?.querySelector('input[name="id"]')?.value);
      recommendations.push({ row, input: row.querySelectorAll('td input')[2],
        itemId: resourceId, seller: localData.seller ?? null,
        sellerUrl: localData.sellerUrl ?? null,
        sellerPrice: Number(localData.minPrice), price: recommendation.price });
      if (render) AddLine.appendShopCount(row, localData, resourceId, recommendation);
      reportProgress(recommendations.length);
    });

    // All calls finished: mark countShop done and enable apply all.
    this.controls.countCheck.style.visibility = "visible";
    this.controls.applyAll.disabled = false;
    this.controls.recommendations = recommendations;
    if (scroll) this.controls.applyAll.focus({ preventScroll: true });
    return recommendations;
  },
};
