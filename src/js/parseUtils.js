export class IslandShopData {
  constructor(minPrice = null, seller = null, sellerUrl = null) {
    this.minPrice = minPrice;
    this.seller = seller;
    this.sellerUrl = sellerUrl;
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

export function sellerProfileUrl(href) {
  if (!href) return null;
  try {
    const url = new URL(href, 'https://www.gwars.io');
    const id = url.searchParams.get('id');
    if (['http:', 'https:'].includes(url.protocol) &&
        ['gwars.io', 'www.gwars.io'].includes(url.hostname) &&
        url.pathname === '/info.php' && /^\d+$/.test(id)) {
      return `/info.php?id=${id}`;
    }
  } catch { /* No usable player profile link. */ }
  return null;
}

let playerNameBytes;
export function sellerSearchUrl(seller) {
  if (!seller?.trim()) return null;
  // The game's search form uses windows-1251, including Cyrillic player names.
  if (!playerNameBytes) {
    const decoder = new TextDecoder('windows-1251');
    playerNameBytes = new Map();
    for (let byte = 128; byte < 256; byte++) {
      playerNameBytes.set(decoder.decode(Uint8Array.of(byte)), byte);
    }
  }
  const key = [...seller.trim()].map((character) => {
    const byte = playerNameBytes.get(character);
    return byte === undefined ? encodeURIComponent(character) : `%${byte.toString(16).toUpperCase()}`;
  }).join('');
  return `/search.php?key=${key}`;
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
  const sellerElement = minPriceElement?.querySelector('b');
  const seller = sellerElement?.innerText;

  const sellerLink = [...(minPriceElement?.querySelectorAll('a[href]') || [])]
    .find((link) => (link.contains(sellerElement) ||
      sellerElement?.contains(link) || link.textContent.trim() === seller?.trim()) &&
      sellerProfileUrl(link.getAttribute('href')));
  const sellerUrl = sellerProfileUrl(sellerLink?.getAttribute('href'));
  return new IslandShopData(minPrice, seller, sellerUrl);
}
