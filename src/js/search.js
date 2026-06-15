import { Http } from "./http";
import { Parse } from "./parsers";
import { Fetcher } from "./fetchers";
import { AddLine } from "./addLine";
import { Settings } from "./settings";

export const Search = {
  // Build the shop-table controls (countShop + apply all) up front, so the
  // "countShop" trigger lives next to "apply all" instead of in the nav bar.
  init() {
    if (!Settings.showButtons.countShop) {
      return;
    }
    const table = document.querySelector(
      "form[action='/objectedit.php'] table[cellpadding='4']"
    );
    if (!table) {
      return;
    }
    // null on non-shop tables (no "Цена продажи" header).
    this.controls = AddLine.buildShopControls(table, () => this.findShopPrices());
  },

  async findShopPrices() {
    if (!this.controls) {
      return;
    }
    const island = Parse.parseIsland();
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const table = document.querySelector(
      "form[action='/objectedit.php'] table[cellpadding='4']"
    );
    let rows = table.rows;
    let filteredRows = Array.prototype.filter.call(rows, (elem) => {
      const count = +elem.querySelectorAll("td")[1]?.innerText;
      const resourceId = elem
        .querySelectorAll("td input[name]")?.[0]
        ?.name?.slice(7, -1);
      return count !== 0 && resourceId && !isNaN(count);
    });

    await Http.processWithDelay(filteredRows, async (row) => {
      let inputPriceLine = row.querySelectorAll("td input[name]");
      let resourceId = inputPriceLine[0].name.slice(7, -1);

      const shopsDoc = await Fetcher.shopsList(resourceId);
      const parsedShops = Parse.shopPriceFromShopsList(shopsDoc);
      const localData = parsedShops[island];

      if (localData?.isNoOffers) {
        await delay(200);
        const marketDoc = await Fetcher.adverticementsList(resourceId);
        localData.minPrice = Parse.gosPrice(marketDoc);
      }
      AddLine.appendShopCount(row, localData, resourceId);
    });

    // All calls finished: mark countShop done and enable apply all.
    this.controls.countCheck.style.visibility = "visible";
    this.controls.applyAll.disabled = false;
  },
};
