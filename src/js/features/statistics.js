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

    // Stored quantities across the storage houses, fetched before populating.
    this.availability = await this.#fetchAvailability();

    // Map each developed item to a property that develops it (for the ✓ link).
    this.developedBy = {};
    for (const [propertyId, items] of Object.entries(
      Storage.getPropertyResources()
    )) {
      (items || []).forEach((id) => {
        if (!this.developedBy[id]) {
          this.developedBy[id] = propertyId;
        }
      });
    }

    let groups = Ordinal.getGroupedElements();
    const itemIds = Object.values(groups).flatMap((items) =>
      items.map((item) => item.id)
    );
    this.totalItems = itemIds.length;
    this.renderedItems = 0;
    this.advertisementPrices = new Map();
    App.result.setProgress("rows", 0, itemIds.length);

    for (const [key, value] of Object.entries(groups)) {
      const items = value.map((x) => x.id);
      await this.#renderStatisticsSection(items, key);
    }

    await this.#populateAdvertisementPrices(itemIds);
    await this.#populateResourcePrices(itemIds);
    App.result.setProgress("done", itemIds.length, itemIds.length);
  };

  // Sum how many of each item is stored across the three storage houses linked
  // in the nav ("Д Мікс", "Д Стволи", "Д Бронь"). Returns { itemId: total }.
  async #fetchAvailability() {
    const labels = ["Д Мікс", "Д Стволи", "Д Бронь"];
    const links = [...document.querySelectorAll("a")].filter((a) =>
      labels.includes(a.textContent.trim())
    );
    App.result.setProgress("availability", 0, links.length);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const totals = {};
    let completed = 0;

    for (const link of links) {
      const doc = await Http.fetchGet(link.href);
      // Each resource row carries input[name="resource"]; its quantity is the
      // second <td> ("#") of the row.
      doc.querySelectorAll('input[name="resource"]').forEach((input) => {
        const id = input.value;
        const qty = Number(input.closest("tr")?.cells[1]?.textContent.trim());
        if (id && Number.isFinite(qty)) {
          totals[id] = (totals[id] || 0) + qty;
        }
      });
      completed += 1;
      App.result.setProgress("availability", completed, links.length);
      await delay(200);
    }

    return totals;
  }

  async #renderStatisticsSection(items, key) {
    const island = Parse.parseIsland();
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const sectionText = `<th colspan="9">${key} <a href="#" class="item-finder__search-results-close section-toggle">закрити</a></th>`;
    const headerRow = AddLine.addItemLine(sectionText);
    headerRow.classList.add("section-header");
    headerRow.querySelector(".section-toggle").onclick = (event) => {
      event.preventDefault();
      this.#toggleSection(headerRow);
    };

    return Http.processWithDelay(
      items,
      async (itemId) => {
        const shopsDoc = await Fetcher.shopsList(itemId);

        const parsedShops = Parse.shopPriceFromShopsList(shopsDoc);
        const shopData = parsedShops[island];
        let { minPrice } = shopData;
        if (shopData.isNoOffers) {
          await delay(200);
          const marketDoc = await Fetcher.adverticementsList(itemId);
          minPrice = Parse.gosPrice(marketDoc);
          this.advertisementPrices.set(itemId, minPrice);
        }

        const cost = Math.round(Storage.getCost(itemId));
        const difference = +minPrice - cost;
        const shopPriceUrl = shopData.isNoOffers
          ? `${Settings.domain}/market.php?buy=1&item_id=${itemId}`
          : `${Settings.domain}/statlist.php?r=${itemId}&type=i`;
        const shopPrice = minPrice
          ? `<a href="${shopPriceUrl}">${minPrice}</a>`
          : "-";
        const differenceText = minPrice ? difference : "-";
        const availability = this.availability?.[itemId] || 0;
        const hasProduction = Boolean(this.developedBy?.[itemId]);
        const availabilityClass = this.#availabilityClass(
          cost,
          availability,
          hasProduction
        );

        let text = `
            <td class="wb smallBox"><input type="checkbox" id="${itemId}"></td>
            <td class="wb">${this.#getItemLink(itemId, parsedShops.title)}</td>
            <td class="wb" id="${itemId}ShopPrice">${shopPrice}</td>
            <td class="wb">${cost}</td>
            <td class="wb" id="${itemId}AdvertisementPrice">...</td>
            <td class="wb ${
              difference > 10000 && availability <= 3 && !hasProduction
                ? "green"
                : ""
            }" id="${itemId}Difference">${differenceText}</td>
            <td id="${itemId}ResourcePrice">...</td>
            <td class="wb ${availabilityClass}">${availability}</td>
            <td class="wb">${
              hasProduction
                ? `<a class="green" target="_blank" href="${Settings.domain}/object.php?id=${this.developedBy[itemId]}">✓</a>`
                : "<span class='red'>x</span>"
            }</td>`;

        AddLine.addItemLine(text, itemId);
        this.renderedItems += 1;
        App.result.setProgress("rows", this.renderedItems, this.totalItems);
      },
      200
    );
  }

  #availabilityClass(cost, availability, hasProduction) {
    if (!hasProduction) {
      return "";
    }

    let thresholds;
    if (cost > 200000) {
      thresholds = { low: 10, medium: 15, high: 20 };
    } else if (cost >= 100000) {
      thresholds = { low: 15, medium: 20, high: 25 };
    } else if (cost >= 60000) {
      thresholds = { low: 20, medium: 30, high: 40 };
    } else {
      thresholds = { low: 30, medium: 50, high: 70 };
    }

    if (availability >= thresholds.high) {
      return "availability-high";
    }
    if (availability >= thresholds.medium) {
      return "availability-medium";
    }
    if (availability >= thresholds.low) {
      return "availability-low";
    }
    return "";
  }

  async #populateAdvertisementPrices(itemIds) {
    App.result.setProgress("advertisements", 0, itemIds.length);
    let completed = 0;
    return Http.processWithDelay(
      itemIds,
      async (itemId) => {
        let advertisementPrice;
        if (this.advertisementPrices.has(itemId)) {
          advertisementPrice = this.advertisementPrices.get(itemId);
        } else {
          const marketDoc = await Fetcher.adverticementsList(itemId);
          advertisementPrice = Parse.gosPrice(marketDoc);
        }
        const cell = document.getElementById(`${itemId}AdvertisementPrice`);
        if (cell) {
          const link = document.createElement("a");
          link.href = `${Settings.domain}/market.php?buy=1&item_id=${itemId}`;
          link.textContent = advertisementPrice
            ? Math.round(advertisementPrice - Storage.getCost(itemId))
            : "-";
          cell.replaceChildren(link);
        }

        completed += 1;
        App.result.setProgress("advertisements", completed, itemIds.length);
      },
      200
    );
  }

  async #populateResourcePrices(itemIds) {
    App.result.setProgress("resources", 0, itemIds.length);
    let completed = 0;
    return Http.processWithDelay(
      itemIds,
      async (itemId) => {
        const resourceDoc = await Fetcher.resourceList(itemId);
        const resourcePrice = Parse.resourcePrice(resourceDoc, itemId);
        const cell = document.getElementById(`${itemId}ResourcePrice`);
        if (cell) {
          const link = document.createElement("a");
          link.href = `${Settings.domain}/statlist.php?r=${itemId}`;
          link.textContent =
            typeof resourcePrice === "number"
              ? Math.round(resourcePrice)
              : resourcePrice;
          cell.replaceChildren(link);
        }

        completed += 1;
        App.result.setProgress("resources", completed, itemIds.length);
      },
      200
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
