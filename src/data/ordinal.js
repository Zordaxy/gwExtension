import { ProductionOnZ } from './production-on-z';
import { ProductionOnG } from './production-on-g';

export const Ordinal = {
    get(id) {
        return [...ProductionOnG, ...ProductionOnZ].find(elem => {
            return elem.id === id
        });
    },

    getIDs() {
        return ProductionOnG.filter(item => item.id).map(item => item.id);
    },

    getGroupedElements() {
        const itemsWithGroup = ProductionOnG.filter(x => x.shopType);
        return Object.groupBy(itemsWithGroup, (x) => x.shopType);
    }
}
