import { Settings } from "./settings";
import { Ordinal } from "../data/ordinal";
import { ProductionOnZ } from '../data/production-on-z';
import { ProductionOnG } from '../data/production-on-g';

export const Storage = {
    getCost(id) {
        let supply = [...ProductionOnG, ...ProductionOnZ].filter(element => {
            return element.id === id;
        })[0];

        if (!supply) {
            return null;
        }

        let resources = Settings.resources;
        let price = 0;
        for (let key of Object.keys(supply)) {
            if (resources[key]) {
                price += supply[key] * resources[key];
            }
        }
        return price / supply.power;
    },

    getItems() {
        return window.localStorage.getItem(Keys.itemKey) || [];
    },

    saveItem(item) {
        let items = this.getItems();
        if (!items.includes(item)) {
            items.push(item);
            window.localStorage.setItem(Keys.itemKey, JSON.stringify(items));
        }
    },

    hasItem(item) {
        this.getItems().includes(item);
    },

    removeItem(el) {
        let items = this.getItems().filter(entry => entry !== el)
        window.localStorage.setItem(Keys.itemKey, JSON.stringify(items));
    },

    setPrice(price) {
        window.localStorage.setItem(Keys.priceToSet, price);
    },

    getPrice() {
        return window.localStorage.getItem(Keys.priceToSet);
    },

    setDurability(number, durability) {
        // number 1 or 2
        window.localStorage.setItem(`durability${number}`, durability);
    },

    getDurability(number) {
        return window.localStorage.getItem(`durability${number}`);
    },

    getLabel() {
        return window.localStorage.getItem('label');
    },

    setLabel(value) {
        window.localStorage.setItem('label', value);
    },

    // propertyId -> shopTypes[], learned when a property's objectedit page is
    // opened. Used by the realty page to sub-sort properties by shop type.
    getPropertyTypes() {
        return JSON.parse(window.localStorage.getItem(Keys.propertyTypes) || '{}');
    },

    setPropertyTypes(propertyId, shopTypes) {
        const all = this.getPropertyTypes();
        all[propertyId] = shopTypes;
        window.localStorage.setItem(Keys.propertyTypes, JSON.stringify(all));
    },

    // propertyId -> developed item ids[], learned the same way. Used to mark in
    // the price table whether any property develops a given item.
    getPropertyResources() {
        return JSON.parse(window.localStorage.getItem(Keys.propertyResources) || '{}');
    },

    setPropertyResources(propertyId, resources) {
        const all = this.getPropertyResources();
        all[propertyId] = resources;
        window.localStorage.setItem(Keys.propertyResources, JSON.stringify(all));
    },

    removePropertyResources(propertyId) {
        const all = this.getPropertyResources();
        if (propertyId in all) {
            delete all[propertyId];
            window.localStorage.setItem(Keys.propertyResources, JSON.stringify(all));
        }
    },

    // { resourceId: missingCount } captured from one shop's "Приобретаемые
    // ресурсы" table. Single object — overridden each time, not kept per shop.
    getMissing() {
        return JSON.parse(window.localStorage.getItem(Keys.shopMissing) || '{}');
    },

    setMissing(missing) {
        window.localStorage.setItem(Keys.shopMissing, JSON.stringify(missing));
    },

    // { shopId: timestamp } of the last "save shop settings" click, kept per
    // shop (a shop can only save its prices once every 4 hours).
    getShopSaveTimes() {
        return JSON.parse(window.localStorage.getItem(Keys.shopSaveTimes) || '{}');
    },

    setShopSaveTime(shopId, timestamp) {
        const all = this.getShopSaveTimes();
        all[shopId] = timestamp;
        window.localStorage.setItem(Keys.shopSaveTimes, JSON.stringify(all));
    }
}

class Keys {
    static itemKey = 'item-price';
    static priceToSet = 'item-priceToSet';
    static propertyTypes = 'property-shopTypes';
    static propertyResources = 'property-resources';
    static shopMissing = 'shop-missing';
    static shopSaveTimes = 'shop-save-times';
}