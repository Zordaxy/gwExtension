import { Storage } from "js/storage";
import { Http } from "js/http";
import { Settings } from "js/settings";
import { Parse } from "js/parse";
import { Fetcher } from "js/fetcher";
import { AddLine } from "js/addLine";
import { App } from "js/app";
import { Ordinal } from "data/ordinal";

export class Statistics {
  // TODO: fix manual adverticements in statistics
  // TODO: fix layout
  findStatistic = async (event) => {
    // event.preventDefault();
    Storage.getItems();

    App.result.open();
    App.blacker.show();

    let groups = Ordinal.getGroupedElements();

    for (const [key, value] of Object.entries(groups)) {
      const items = value.map((x) => x.id);
      await this.#renderStatisticsSection(items, key);
    }
  };

  async #renderStatisticsSection(items, key) {
    const island = Parse.parseIsland();
    const sectionText = `<th colspan="7">${key} <a href="#" id="closeResult" class="item-finder__search-results-close">закрити</span></th>`;
    AddLine.addItemLine(sectionText);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    return Http.processWithDelay(
      items,
      async (itemId) => {
        const shopsDoc = await Fetcher.statlistShops(itemId);
        await delay(200);
        const marketDoc = await Fetcher.marketBuy(itemId);
        await delay(200);
        const resDoc = await Fetcher.statlistResource(itemId);

        const parsedShops = Parse.parseShopsPrice(shopsDoc);
        const { minPrice } = parsedShops[island];
        const minSellerPrice = Parse.parseSellersPrice(marketDoc);
        let resourcePrice = Parse.parseResPrice(resDoc, itemId);

        let cost = Storage.getCost(itemId);
        const difference = +minPrice - cost;

        let text = `
            <td class="wb smallBox"><input type="checkbox" id="${itemId}"></td>
            <td class="wb">${this.#getItemLink(itemId, parsedShops.title)}</td>
            <td class="wb">${minPrice}</td>
            <td class="wb">${cost}</td>
            <td class="wb">${minSellerPrice ? minSellerPrice - cost : "-"}</td>
            <td class="wb" id="${itemId}Difference">${difference}</td>
            <td>
                <a href="${
                  Settings.domain
                }/statlist.php?r=${itemId}">${resourcePrice}</a>
            </td>`;

        AddLine.addItemLine(text, itemId);
      },
      600
    );
  }

  #getItemLink(itemId, title) {
    return `<b><a href="${Settings.domain}/item.php?item_id=${itemId}">${title}</a></b>`;
  }
}
