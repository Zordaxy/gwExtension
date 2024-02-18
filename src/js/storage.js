import { Settings } from "./settings";
import { Ordinal } from "../data/ordinal";

export const Storage = {
    getCost(name) {
        let supply = Ordinal.list.filter(element => {
            return element.name === name;
        })[0];

        if (!supply) {
            return null;
        }

        let resources = Settings.resources;
        let price = 0;
        for (let key of Object.keys(supply)) {
            price += supply[key] * resources[key];
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
        window.localStorage.getItem(Keys.priceToSet);
    },

    setDurability(number, durability) {
        // number 1 or 2
        window.localStorage.setItem(`durability${number}`, durability);
    },

    getDurability(number) {
        return window.localStorage.getItem(`durability${number}`);
    }
}

class Keys {
    static itemKey = 'item-price';
    static priceToSet = 'item-priceToSet';
}