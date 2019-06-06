define("search", function (require, exports, module) {
    let storage = require("storage");
    let http = require("http");
    let settings = require("settings");
    let parse = require("parse");
    let addLine = require("addLine");
    let widgets = require("widgets");
    let ordinal = require("../data/ordinal");
    let highTeck = require("../data/highTeck");

    //Buildings
    function findBuildings(table) {
        var owners = settings.rentOwners;
        for (var owner in owners) {
            searchBuildings(table, owner, owners[owner]);
        }
    }

    function searchBuildings(table, owner, buildings) {
        var url = '/info.realty.php?id=' + owner;
        var request = function (url) {
            return http.ajaxQuery(url, 'GET', '', function (xhr) {
                var div = document.createElement('div');
                div.innerHTML = xhr.responseText;

                buildings.forEach(function (id) {
                    var selector = "a[href='/object.php?id=" + id + "']";
                    var buildingTitle = div.querySelector(selector);
                    if (buildingTitle) {
                        var buildingLine = buildingTitle.closest('tr');
                        table.appendChild(buildingLine);
                    }
                });
            });
        };
        request(url);
    }

    //Bug
    function findBagList() {
        var itemsList = [];
        var i = 0;
        var timerId = setInterval(function () {
            var curentId = 'item_tr1_' + i;
            if (document.getElementById(curentId)) {
                var selector = "#item_tr1_" + i + " a";
                var itemLink = document.querySelector(selector).href;

                var firstIndex = itemLink.indexOf("=") + 1;
                var lastIndex = (itemLink.indexOf("&") > 0) ? itemLink.indexOf("&") : null;
                var itemId = lastIndex ? itemLink.slice(firstIndex, lastIndex) : itemLink.slice(firstIndex);
                itemsList.push(itemId);

                searchBagList(itemId, curentId);
            }
            i++;
            if (i === 110) {
                clearInterval(timerId);
            }
        }, 400);
    }

    function searchBagList(itemId, lineId) {
        var url = '/market.php?stage=2&item_id=' + itemId + '&action_id=1&island=-1';
        var request = function (url) {
            return http.ajaxQuery(url, 'GET', '', function (xhr) {
                var div = document.createElement('div');
                div.innerHTML = xhr.responseText;
                var minItem = parse.parseMinAdvPrice(div, itemId);
                var cost = storage.getCost(itemId);
                if (minItem) {
                    addLine.appendAdvertisementData(lineId, minItem.price, minItem.seller, cost);
                }
            });
        };
        request(url);
    }

    //Shop
    function findShopPrices() {
        var rows = document.querySelector("form[action='/objectedit.php'] table[cellpadding='4']").rows;
        var filteredRows = Array.prototype.filter.call(rows, function (elem) {
            return elem.querySelectorAll("td")[1] && +elem.querySelectorAll("td")[1].innerText !== 0
                && !isNaN(+elem.querySelectorAll("td")[1].innerText);
        });

        var i = 0;
        var timerId = setInterval(function () {
            var inputPriceLine = filteredRows[i].querySelectorAll("td input[name]");
            var resourceId = inputPriceLine[0].name.slice(7, -1);
            searchShopPrices(resourceId, filteredRows[i]);
            i++;
            if (i == filteredRows.length) {
                clearInterval(timerId);
            }
        }, 400);
    }

    function searchShopPrices(itemId, row) {
        var url = '/market.php?stage=2&item_id=' + itemId + '&action_id=1&island=-1';
        var request = function (url) {
            return http.ajaxQuery(url, 'GET', '', function (xhr) {
                var div = document.createElement('div');
                div.innerHTML = xhr.responseText;

                var minShop = parse.parseMinShopPrice(div);
                addLine.appendShopCount(row, minShop, itemId);
            });
        };
        request(url);
    }

    //Statistic
    function findStatistic(e) {
        e.preventDefault();
        storage.getItems();

        widgets.result.open();
        widgets.blacker.show();

        let items = ordinal.getIDs();

        var i = 0;
        var timerId = setInterval(function () {
            if (items[i].indexOf("category") !== -1) {
                let text = '\
                                <td class="wb smallBox"></td>\
                                <td class="wb" colspan="7">' + ordinal.get(items[i]).category + '</td>\
                ';
                addLine.addItemLine(text);
                i++;
            }
            searchStatisticItem(items[i]);
            i++;
            if (i == items.length) {
                clearInterval(timerId);
            }
        }, 1000);

    }

    function searchStatisticItem(itemId) {
        var url = '/market.php?stage=2&item_id=' + itemId + '&action_id=1&island=-1';
        var request = function (url) {
            return http.ajaxQuery(url, 'GET', '', function (xhr) {
                var div = document.createElement('div');
                div.innerHTML = xhr.responseText;
                var cost = storage.getCost(itemId);
                var minShop = parse.parseMinShopPrice(div, cost);
                var minItem = parse.parseMinAdvPrice(div, itemId);
                var advDifference = (minItem && minItem.price) ? minItem.price - cost : "-";

                var text = '\
                                <td class="wb smallBox"><input type="checkbox" id="' + itemId + '"></td>\
                                <td class="wb">' + getItemLink(itemId, minShop.title) + '</td>\
                                <td class="wb">' + minShop.minPrice + '</td>\
                                <td class="wb">' + cost + '</td>\
                                <td class="wb">' + advDifference + '</td>\
                                <td class="wb" id="' + itemId + 'Difference">' + minShop.difference + '</td>\
                ';
                setTimeout(searchStatisticResource(itemId, text, minShop.minPrice), 400);
            });
        };
        request(url);
    }

    function searchStatisticResource(itemId, text, minPrice) {
        var url = '/statlist.php?r=' + itemId;
        var request = function (url) {
            return http.ajaxQuery(url, 'GET', '', function (xhr) {
                var div = document.createElement('div');
                div.innerHTML = xhr.responseText;

                var resPrice = parse.parseResPrice(div, itemId);
                var isPriceGood = (minPrice - resPrice) > 10000 && minPrice / resPrice > 2;
                var textClass = isPriceGood ? " goodPrice" : "";

                var text2 = '\
                        <td class="wb' + textClass + '"><a href="http://www.ganjawars.ru/statlist.php?r=' + itemId + '">' + resPrice + '</a></th>\
                        ';
                addLine.addItemLine(text + text2, itemId);
            });
        };
        request(url);
    }

    //EUN
    function findEuns(e) {
        e.preventDefault();

        widgets.result.open();
        widgets.blacker.show();

        let items = highTeck.getIDs();

        var i = 0;
        var timerId = setInterval(function () {
            searchEun(items[i]);
            i++;
            if (i === items.length) {
                clearInterval(timerId);

                var endLine = document.createElement('tr');
                endLine.innerHTML = "<td colspan='7'>End of the list</td>";
                endLine.className = 'wb';
                widgets.result.content.appendChild(endLine);
            }
        }, 1000);
    }

    function searchEun(itemId) {
        var page = 0;
        var url = '/market.php?stage=2&item_id=' + itemId + '&action_id=1&island=-1';
        var request = function (url) {
            http.ajaxQuery(url, 'GET', '', function (xhr) {
                var div = document.createElement('div'),
                    elems, pages;
                div.innerHTML = xhr.responseText;
                if (div.getElementsByTagName('li').length === 0) {
                    return
                }
                var title = div.getElementsByTagName('li')[0].parentNode.getElementsByTagName('a')[0].textContent;
                elems = div.querySelectorAll('table.wb tr');
                pages = div.querySelectorAll('br ~ center b a');
                var sellEunPrice = Math.floor(+div.querySelector("li b").textContent.slice(0, -4) * 0.9);
                var maxPrice = sellEunPrice * localStorage.maxPrice;
                var minPrice = sellEunPrice * settings.eun.minPrice;
                if (pages.length > 1 && page < pages.length - 1) {
                    for (var i = 1, l = pages.length; i < l; i++) {
                        request(pages[i].href);
                        ++page;
                    }
                }

                for (var i = 3, l = elems.length; i < l; i++) {
                    var td = elems[i].getElementsByTagName('td'),
                        cost = td[0].textContent.replace(/[\$\,]/g, '') | 0;
                    //dur = /(\d+)\/(\d+)/.exec(td[1].textContent)[2] | 0;
                    if ((maxPrice > 0 && maxPrice < cost) || (minPrice > cost)) continue;
                    //if (item.dur > 0 && item.dur > dur) continue;
                    var itemLink = document.createElement('td');
                    var pricePerEun = (cost / (sellEunPrice * 1000)).toFixed(1);
                    itemLink.innerHTML = getItemLink(itemId, title) + "(" + pricePerEun + ")";
                    itemLink.className = 'wb';
                    elems[i].insertBefore(itemLink, td[0]);
                    widgets.result.content.appendChild(elems[i]);

                }
            })
        };
        request(url)
    }

    function getItemLink(itemId, title) {
        return '<b><a href="http://www.ganjawars.ru/item.php?item_id=' + itemId + '">' + title + '</a></b>';
    }

    exports.findBuildings = findBuildings;
    exports.findStatistic = findStatistic;
    exports.findEuns = findEuns;
    exports.findBagList = findBagList;
    exports.findShopPrices = findShopPrices;
    return exports;
});
