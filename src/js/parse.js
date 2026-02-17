import { Storage } from "./storage";
import { Ordinal } from "../data/ordinal";

export const Parse = {
  // Expects doc from: Fetcher.marketAdvert(itemId)
  parseMinAdvPrice(div, itemId, isDrop = false) {
    let rawElems = div.querySelectorAll("table")[0].querySelectorAll("tr");

    let elems = [].filter.call(rawElems, (elem) => {
      const tds = elem.querySelectorAll("td");
      return [].filter.call(tds, (element) => {
        return element.textContent.trim() === "[G]";
      });
    });

    let item = Ordinal.get(itemId);
    let results = [];

    if (!item) return null;

    let durability = item.durability;

    elems.forEach((tr) => {
      const td = [...tr.querySelectorAll("td")];
      let dur = td[1]?.textContent;
      let island = td[3]?.textContent?.slice(1, 2);
      let price =
        td[0]?.querySelector("b")?.textContent?.replace(/[\$\,]/g, "") | 0;
      let seller = td[4]?.textContent?.slice(
        0,
        td[4]?.textContent?.indexOf(" [")
      );
      const isIndirectSell = td[4]?.textContent?.indexOf("написать") > 0;

      if (!isIndirectSell && island === "G" && price) {
        if (isDrop && +dur > 2) {
          price = +Math.floor(+price / +dur);
          results.push({ price, seller });
        } else if (dur === durability + "/" + durability) {
          results.push({ price, seller });
        }
      }
    });
    results?.sort((a, b) => a?.price < b?.price);

    return results?.[0];
  },

  // Expects doc from: Fetcher.marketAdvert(itemId)
  getMinShopPrice(div) {
    const td = [...div.querySelectorAll("td.greengreenbg")].find((el) =>
      el.textContent.includes("Дешевле всего за")
    );

    const priceBold = [...td.querySelectorAll("b")].find((b) => {
      const prev = b.previousSibling;
      return (
        prev &&
        prev.nodeType === Node.TEXT_NODE &&
        prev.textContent.includes("Дешевле всего за")
      );
    });

    const priceText = priceBold?.textContent.trim(); // "257,710$"

    // convert "113,994$" → 113994
    const price = parseInt(priceText.replace(/[,$]/g, ""));

    return price;
  },

  /**
   *
   * Expects doc from: Fetcher.statlistShops(itemId)
   * @param {Document} doc
   * @returns {
   *      title,
   *      Z: {
   *          minPrice: string
   *          seller: string,
   *          isNoOffers: boolean
   *      },
   *      G: {
   *          minPrice: string
   *          seller: string,
   *          isNoOffers: boolean
   *      }
   *
   * }
   */
  parseShopsPrice(doc) {
    const result = {
      Z: {},
      G: {},
    };

    result.title = doc.querySelector("center table a b")?.innerText;
    const listSelector = doc.querySelectorAll("center table table tr");
    const list = [...listSelector];
    // Remove table header
    list?.shift();

    const gList = list.filter((tr) => {
      const shopIsland = tr.querySelector("a")?.innerText?.substring(1, 2);
      return shopIsland === "G";
    });
    result.G = this._aggregateShopRows(gList);

    const zList = list.filter((tr) => {
      const shopIsland = tr.querySelector("a")?.innerText?.substring(1, 2);
      return shopIsland === "Z";
    });
    result.Z = this._aggregateShopRows(zList);

    return result;
  },

  _aggregateShopRows(rows) {
    const minPriceElement = rows.find((tr) => {
      const owner = tr.querySelector("b").innerText;
      const price = tr.querySelectorAll("td")[2].innerText.trim().substring(1);
      if (!owner || !price) {
        console.log("[Parsing error] - specific shop data is missing");
        return false;
      }

      if (owner === "Michegan") {
        return false;
      }
      return true;
    });
    const minPrice = minPriceElement
      ?.querySelectorAll("td")[2]
      .innerText.trim()
      .substring(1);
    const seller = minPriceElement?.querySelector("b").innerText;

    return {
      minPrice,
      seller,
      isNoOffers: !minPrice,
    };
  },

  // Expects doc from: Fetcher.marketBuy(itemId)
  parseGosPrice(doc) {
    const gosShopRawPrice = doc.querySelector(
      'table [class="greengraybg"] div b'
    )?.innerText;
    if (!gosShopRawPrice) {
      console.log("[Parsing errors] - cannot parse gos price");
      return;
    }

    const gosShopPrice = gosShopRawPrice
      .substring(0, gosShopRawPrice.length - 1)
      .split(",")
      .join("");
    return +gosShopPrice;
  },

  // Expects doc from: Fetcher.statlistResource(itemId)
  parseResPrice(doc, itemId) {
    let prices = [];
    let trs = doc
      .querySelector("a[href='/stats.php']")
      ?.parentNode.querySelector("table td")
      ?.nextElementSibling?.getElementsByTagName("tr");
    for (let i = 0; i < trs?.length; i++) {
      if (trs?.[i].children[2]) {
        let price = +trs[i].children[2].textContent.slice(2, -1);
        if (price) {
          prices.push(price);
        }
      }
    }
    return prices.length
      ? Math.min.apply(Math, prices) - Storage.getCost(itemId)
      : "-";
  },

  parseIsland() {
    let island = document
      .querySelectorAll("table table a b")?.[1]
      ?.innerText?.substring(1, 2);
    if (island !== "G" && island !== "Z") {
      console.log(
        "[Island parsing error] - island not found in shop page. Found: ",
        island,
        "Set G as default"
      );
      island = "G";
    }

    return island;
  },
};
