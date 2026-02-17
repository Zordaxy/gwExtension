import { Http } from "./http";

const Urls = {
  statlistShops: (itemId) => `/statlist.php?r=${itemId}&type=i`,
  statlistResource: (itemId) => `/statlist.php?r=${itemId}`,
  marketBuy: (itemId) => `/market.php?buy=1&item_id=${itemId}`,
  marketAdvert: (itemId) => `/market.php?stage=2&item_id=${itemId}&action_id=1&island=-1`,
};

export const Fetcher = {
  Urls,
  async statlistShops(itemId) {
    return Http.fetchGet(Urls.statlistShops(itemId));
  },
  async statlistResource(itemId) {
    return Http.fetchGet(Urls.statlistResource(itemId));
  },
  async marketBuy(itemId) {
    return Http.fetchGet(Urls.marketBuy(itemId));
  },
  async marketAdvert(itemId) {
    return Http.fetchGet(Urls.marketAdvert(itemId));
  },
};
