define(['settings', '../data/ordinal', '../data/highTeck'], function (settings, ordinal, highTeck) {
    let _itemKey = 'item-price';
    let _itemInfoKey = 'item-info';
    let _priceToSet = 'item-priceToSet';
    let _storage = window.localStorage;
    let _items = [];
    let _itemsInfo;

    function getCost (name) {
        var supply = ordinal.list.filter(function (element) {
            return element.name === name;
        })[0];

        if (!supply) {
            return null;
        }

        var resources = settings.resources;
        var price = 0;
        for (var key in supply) {
            if (resources.hasOwnProperty(key)) {
                price += supply[key] * resources[key];
            }
        }
        price = price / supply.power;
        return price;
    }

    function getItems () {
        var items = _storage.getItem(_itemKey);
        _items = items ? JSON.parse(items) : [];
        return _items;
    }

    function getItemsInfo () {
        var items = _storage.getItem(_itemInfoKey);
        _itemsInfo = items ? JSON.parse(items) : [];
        return _items;
    }

    function saveItem (item) {
        if (item) {
            _items.push(item);
        }
        _storage.setItem(_itemKey, JSON.stringify(_items));
    }

    function saveItemInfo (item) {
        if (item) {
            _itemsInfo.push(item);
        }
        _storage.setItem(_itemInfoKey, JSON.stringify(_items));
    }

    function removeItem (el) {
        let items = getItems();
        items.forEach(function (item, i) {
            if (item === el) {
                items.splice(i, 1);
            }
        }.bind(this));
        _items = items;
        saveItem();
    }

    function setPrice (price) {
        _storage.setItem(_priceToSet, price);
    }

    function getPrice () {
        _storage.getItem(_priceToSet);
    }

    return {
        getCost: getCost,
        getItems: getItems,
        saveItem: saveItem,
        removeItem: removeItem,
        setPrice: setPrice,
        getPrice: getPrice,
        hasItem: function (id) {
            return _items.includes(id)
        }
    }
});

