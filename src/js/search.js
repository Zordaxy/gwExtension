import { Http } from "./http";
import { Parse } from "./parsers";
import { Fetcher } from "./fetchers";
import { AddLine } from "./addLine";

export const Search = {
  // TODO: move to widgets
  async findShopPrices() {
    const island = Parse.parseIsland();
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let rows = document.querySelector(
      "form[action='/objectedit.php'] table[cellpadding='4']"
    ).rows;
    let filteredRows = Array.prototype.filter.call(rows, (elem) => {
      const count = +elem.querySelectorAll("td")[1]?.innerText;
      const resourceId = elem
        .querySelectorAll("td input[name]")?.[0]
        ?.name?.slice(7, -1);
      return count !== 0 && resourceId && !isNaN(count);
    });

    Http.processWithDelay(filteredRows, async (row) => {
      let inputPriceLine = row.querySelectorAll("td input[name]");
      let resourceId = inputPriceLine[0].name.slice(7, -1);

      const shopsDoc = await Fetcher.shopsList(resourceId);
      const parsedShops = Parse.parseShopsPrice(shopsDoc);
      const localData = parsedShops[island];

      if (localData?.isNoOffers) {
        await delay(200);
        const marketDoc = await Fetcher.adverticementsList(resourceId);
        localData.minPrice = Parse.parseGosPrice(marketDoc);
      }
      AddLine.appendShopCount(row, localData, resourceId);
    });
  },
};
