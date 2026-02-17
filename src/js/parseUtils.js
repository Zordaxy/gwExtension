export class IslandShopData {
  constructor(minPrice = null, seller = null) {
    this.minPrice = minPrice;
    this.seller = seller;
    this.isNoOffers = !minPrice;
  }
}

export class ShopsPriceResult {
  constructor(title = null, G = new IslandShopData(), Z = new IslandShopData()) {
    this.title = title;
    this.G = G;
    this.Z = Z;
  }
}

export function aggregateShopRows(rows) {
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

  return new IslandShopData(minPrice, seller);
}
