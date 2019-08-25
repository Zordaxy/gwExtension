import { Settings } from "./settings";
import { Ordinal } from "../data/ordinal";

export const Storage = {
    _items: [],

    getCost(name) {
        var supply = Ordinal.list.filter(element => {
            return element.name === name;
        })[0];

        if (!supply) {
            return null;
        }

        var resources = Settings.resources;
        var price = 0;
        for (var key in supply) {
            if (resources.hasOwnProperty(key)) {
                price += supply[key] * resources[key];
            }
        }
        price = price / supply.power;
        return price;
    },

    getItems() {
        var items = window.localStorage.getItem(Keys.itemKey);
        this._items = items ? JSON.parse(items) : [];
        return this._items;
    },

    saveItem(item) {
        if (item) {
            this._items.push(item);
        }
        window.localStorage.setItem(Keys.itemKey, JSON.stringify(this._items));
    },

    hasItem(item) {
        return this._items.includes(item);
    },

    removeItem(el) {
        let items = this.getItems();
        items.forEach((item, i) => {
            if (item === el) {
                items.splice(i, 1);
            }
        });
        this._items = items;
        this.saveItem();
    },

    setPrice(price) {
        window.localStorage.setItem(Keys.priceToSet, price);
    },

    getPrice() {
        window.localStorage.getItem(Keys.priceToSet);
    }
}

class Keys {
    static itemKey = 'item-price';
    static priceToSet = 'item-priceToSet';
}
