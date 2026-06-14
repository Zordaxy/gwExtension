import { Storage } from "js/storage";
import { Http } from "js/http";
import { Settings } from "js/settings";
import { Parse } from "js/parsers";
import { Fetcher } from "js/fetchers";
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
    const sectionText = `<th colspan="7">${key} <a href="#" class="item-finder__search-results-close section-toggle">закрити</a></th>`;
    const headerRow = AddLine.addItemLine(sectionText);
    headerRow.classList.add("section-header");
    headerRow.querySelector(".section-toggle").onclick = (event) => {
      event.preventDefault();
      this.#toggleSection(headerRow);
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    return Http.processWithDelay(
      items,
      async (itemId) => {
        const shopsDoc = await Fetcher.shopsList(itemId);
        await delay(200);
        const marketDoc = await Fetcher.adverticementsList(itemId);
        await delay(200);
        const resDoc = await Fetcher.resourceList(itemId);

        const parsedShops = Parse.shopPriceFromShopsList(shopsDoc);
        const { minPrice } = parsedShops[island];
        const minGosPrice = Parse.gosPrice(marketDoc);
        let resourcePrice = Parse.resourcePrice(resDoc, itemId);

        let cost = Storage.getCost(itemId);
        const difference = +minPrice - cost;

        let text = `
            <td class="wb smallBox"><input type="checkbox" id="${itemId}"></td>
            <td class="wb">${this.#getItemLink(itemId, parsedShops.title)}</td>
            <td class="wb">${minPrice}</td>
            <td class="wb">${cost}</td>
            <td class="wb">${minGosPrice ? minGosPrice - cost : "-"}</td>
            <td class="wb ${difference > 10000 ? "green" : ""}" id="${itemId}Difference">${difference}</td>
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

  // Collapse/expand the rows under a section header (up to the next header).
  #toggleSection(headerRow) {
    const collapsed = headerRow.classList.toggle("is-collapsed");
    headerRow.querySelector(".section-toggle").textContent = collapsed
      ? "показати"
      : "закрити";

    let row = headerRow.nextElementSibling;
    while (row && !row.classList.contains("section-header")) {
      row.classList.toggle("is-hidden", collapsed);
      row = row.nextElementSibling;
    }
  }

  #getItemLink(itemId, title) {
    return `<b><a href="${Settings.domain}/item.php?item_id=${itemId}">${title}</a></b>`;
  }
}
