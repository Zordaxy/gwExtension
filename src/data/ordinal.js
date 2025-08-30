import { ProductionOnZ } from "./production-on-z";
import { ProductionOnG } from "./production-on-g";
import { Drop } from "./drop";

export const Ordinal = {
  get(id) {
    return [...ProductionOnG, ...ProductionOnZ, ...Drop].find((elem) => {
      return elem.id === id;
    });
  },

  getIDs() {
    return ProductionOnG.filter((item) => item.id).map((item) => item.id);
  },

  getGroupedElements() {
    const itemsWithGroup = ProductionOnG.filter((x) => x.shopType);
    return Object.groupBy(itemsWithGroup, (x) => x.shopType);
  },

  isDrop(id) {
    return Drop.some((elem) => elem.id === id);
  },
};
