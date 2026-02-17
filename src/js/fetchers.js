import { Http } from "./http";

export const Fetcher = {
  async shopsList(itemId) {
    return Http.fetchGet(`/statlist.php?r=${itemId}&type=i`);
  },
  async resourceList(itemId) {
    return Http.fetchGet(`/statlist.php?r=${itemId}`);
  },
  async adverticementsList(itemId) {
    return Http.fetchGet(`/market.php?buy=1&item_id=${itemId}`);
  },
};
