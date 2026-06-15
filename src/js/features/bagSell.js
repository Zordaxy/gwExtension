import { Storage } from "js/storage";
import { Parse } from "js/parsers";
import { Http } from "js/http";
import { Fetcher } from "js/fetchers";
import { Ordinal } from "../../data/ordinal";

export class BagSell {
  // TODO: Add seller to label
  // TODO: Add option to set even price to label
  // TODO: Take into account min shop price
  // TODO: Better visual
  // TODO: remove duplicated code
  findBagList = () => {
    let itemsList = Array.from(
      { length: 160 },
      (_, index) => `item_tr1_${index}`
    )
      .map((id) => document.querySelector(`#${id}`))
      //.map((el) => el?.href)
      .filter((el) => el)
      .map((item) => {
        let curentId = item.id;
        if (!curentId) {
          console.log("Cannot get id for:", item);
          return false;
        }

        let itemLink = document.querySelector(`#${curentId} a`)?.href;
        console.log(itemLink);
        let firstIndex = itemLink.indexOf("=") + 1;
        let lastIndex =
          itemLink.indexOf("&") > 0 ? itemLink.indexOf("&") : null;
        let itemId = lastIndex
          ? itemLink.slice(firstIndex, lastIndex)
          : itemLink.slice(firstIndex);
        console.log(itemId);
        return {
          parent: item,
          element: Ordinal.get(itemId),
        };
      })
      // Only new items (full durability) — skip used ones (e.g. 10/14).
      .filter((x) => x.element && this.#isNew(x.parent));
    console.log(itemsList);

    return Http.processWithDelay(
      itemsList,
      async ({ parent, element }) => {
        if (!element) {
          console.log("No element found");
          return;
        }

        const doc = await Fetcher.adverticementsList(element.id);
        const isDrop = Ordinal.isDrop(element.id);

        let minItem = Parse.advPrice(doc, element.id, isDrop);

        // Take into account min shop price and no such item in advertisement
        let minShopPrice = Parse.shopPriceFromAdvList(doc);
        if (!minShopPrice) {
          console.log("No shop price found");
          return;
        }
        if (minShopPrice < minItem?.price || !minItem) {
          minItem = { price: minShopPrice, seller: "shop" };
        }

        // TODO: Check case with shop price over gos

        if (minItem) {
          const label = `Set to ${minItem.price}`;

          const title = this.#parseTitle(parent);
          const item = Ordinal.get(element.id);

          const durability = isDrop
            ? this.#parseDurability(parent)
            : item?.durability;

          let searchString = `${title} [${durability}/${durability}]`;
          if (isDrop) {
            searchString =
              durability === 1
                ? `${title} [1/1]`
                : `${title} [${durability}/0]`;
          }

          const newPrice = isDrop
            ? (+minItem.price - 1) * durability
            : Math.floor((minItem.price - 1) / 10) * 10;
          const isMine = minItem.seller?.indexOf("Michegan") > -1;
          // Keep the label green only if the item isn't already on sale, or the
          // recommended price undercuts the price it's listed at.
          const listed = this.#listedPrice(parent);
          const green = !isMine && (listed === null || minItem.price < listed);

          const linkNode = this.#generateLink(
            newPrice,
            searchString,
            label,
            green
          );
          parent.appendChild(linkNode);
          // AddLine.appendAdvertisementData(curentId, minItem.price, minItem.seller, Storage.getCost(itemId));
        }
      },
      400
    );
  };

  #generateLink(newCost, searchString, label = "sell eco", green = true) {
    let linkNode = document.createElement("span");
    linkNode.innerHTML = label;
    linkNode.classList.add("sell-eco");
    if (green) linkNode.classList.add("green");

    linkNode.onclick = () => {
      Storage.setPrice(newCost);
      Storage.setLabel(searchString);

      setTimeout(() => {
        let middleClick = new MouseEvent("click", { button: 1, which: 1 });
        let link = [].filter.call(
          document.getElementsByTagName("a"),
          (elem) => {
            return elem.innerHTML === "sell";
          }
        )[0];

        link.dispatchEvent(middleClick);
      }, 400);
    };

    return linkNode;
  }

  #parseTitle(node) {
    let labelNode = node.querySelector('[itemtype="simpleitem"]');

    if (!labelNode) {
      const idSuffix = node.id.split("_").pop();
      labelNode = document
        .querySelector(`#item_tr1_${idSuffix}`)
        .querySelector('[itemtype="simpleitem"]');
    }

    return labelNode?.innerHTML;
  }

  #parseDurability(node) {
    const idSuffix = node.id.split("_").pop();
    const labelNode = document.querySelector(
      `#item_td2_${idSuffix} font[color="#006600"]`
    );

    const durability = labelNode?.textContent.trim();

    return +durability;
  }

  // New = full durability (current === max). Items without a max (consumables)
  // are left for the Ordinal filter to drop, so treat them as new here.
  #isNew(node) {
    const idSuffix = node.id.split("_").pop();
    const td2 = document.querySelector(`#item_td2_${idSuffix}`);
    const match = td2?.textContent.match(/Прочность предмета:\s*(\d+)\/(\d+)/);
    return !match || match[1] === match[2];
  }

  // Price the item is currently listed for, or null when it isn't on sale.
  #listedPrice(node) {
    const idSuffix = node.id.split("_").pop();
    const td2 = document.querySelector(`#item_td2_${idSuffix}`);
    const match = td2?.textContent.match(
      /Предмет выставлен на продажу за \$(\d+)/
    );
    return match ? Number(match[1]) : null;
  }
}
