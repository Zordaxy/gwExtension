import { Settings } from "./settings";
import { Ordinal } from "../data/ordinal";

export class Storage {
    _itemKey = 'item-price';
    _itemInfoKey = 'item-info';
    _priceToSet = 'item-priceToSet';
    _storage = window.localStorage;
    _items = [];
    _itemsInfo;

    getCost(name) {
        var supply = Ordinal.list.filter(function (element) {
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
    }

    getItems() {
        var items = _storage.getItem(_itemKey);
        _items = items ? JSON.parse(items) : [];
        return _items;
    }

    getItemsInfo() {
        var items = _storage.getItem(_itemInfoKey);
        _itemsInfo = items ? JSON.parse(items) : [];
        return _items;
    }

    saveItem(item) {
        if (item) {
            _items.push(item);
        }
        _storage.setItem(_itemKey, JSON.stringify(_items));
    }

    saveItemInfo(item) {
        if (item) {
            _itemsInfo.push(item);
        }
        _storage.setItem(_itemInfoKey, JSON.stringify(_items));
    }

    removeItem(el) {
        let items = getItems();
        items.forEach(function (item, i) {
            if (item === el) {
                items.splice(i, 1);
            }
        }.bind(this));
        _items = items;
        saveItem();
    }

    setPrice(price) {
        _storage.setItem(_priceToSet, price);
    }

    getPrice() {
        _storage.getItem(_priceToSet);
    }
}
