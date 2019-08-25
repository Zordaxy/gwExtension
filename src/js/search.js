import { Storage } from './storage';
import { Http } from './http';
import { Settings } from './settings';
import { Parse } from './parse';
import { AddLine } from './addLine';
import { App } from './app';
import { Ordinal } from '../data/ordinal';
import { HighTeck } from '../data/highTeck';
import { delay, flatMap } from 'rxjs/operators';

export const Search = {
    findBuildings(table) {
        for ([owner, buildings] of Settings.rentOwners) {
            Http.get('/info.realty.php?id=' + owner).subscribe(xhr => {
                var div = document.createElement('div');
                div.innerHTML = xhr.response;

                buildings.forEach(id => {
                    var selector = "a[href='/object.php?id=" + id + "']";
                    var buildingTitle = div.querySelector(selector);
                    if (buildingTitle) {
                        var buildingLine = buildingTitle.closest('tr');
                        table.appendChild(buildingLine);
                    }
                });
            });
        }
    },

    findBagList() {
        var itemsList = [];
        var index = 0;
        var timerId = setInterval(() => {
            if (index++ === 110) {
                clearInterval(timerId);
            }
            var curentId = `item_tr1_${index}`;
            if (document.getElementById(curentId)) {
                var itemLink = document.querySelector(`${curentId} a`).href;

                var firstIndex = itemLink.indexOf("=") + 1;
                var lastIndex = (itemLink.indexOf("&") > 0) ? itemLink.indexOf("&") : null;
                var itemId = lastIndex ? itemLink.slice(firstIndex, lastIndex) : itemLink.slice(firstIndex);
                itemsList.push(itemId);

                Http.get('/market.php?stage=2&item_id=' + itemId + '&action_id=1&island=-1').subscribe(xhr => {
                    var div = document.createElement('div');
                    div.innerHTML = xhr.response;
                    var minItem = Parse.parseMinAdvPrice(div, itemId);
                    if (minItem) {
                        AddLine.appendAdvertisementData(curentId, minItem.price, minItem.seller, Storage.getCost(itemId));
                    }
                });
            }
        }, 400);
    },

    findShopPrices() {
        var rows = document.querySelector("form[action='/objectedit.php'] table[cellpadding='4']").rows;
        var filteredRows = Array.prototype.filter.call(rows, elem => {
            return elem.querySelectorAll("td")[1] && +elem.querySelectorAll("td")[1].innerText !== 0
                && !isNaN(+elem.querySelectorAll("td")[1].innerText);
        });

        var index = 0;
        var timerId = setInterval(() => {
            if (index++ == filteredRows.length) {
                clearInterval(timerId);
            }
            var inputPriceLine = filteredRows[index].querySelectorAll("td input[name]");
            var resourceId = inputPriceLine[0].name.slice(7, -1);

            Http.get('/market.php?stage=2&item_id=' + resourceId + '&action_id=1&island=-1').subscribe(xhr => {
                var div = document.createElement('div');
                div.innerHTML = xhr.response;

                var minShop = Parse.parseMinShopPrice(div);
                AddLine.appendShopCount(filteredRows[i], minShop, resourceId);
            });
        }, 400);
    },

    findStatistic(event) {
        event.preventDefault();
        Storage.getItems();

        App.result.open();
        App.blacker.show();

        let items = Ordinal.getIDs();

        var index = 0;
        var timerId = setInterval(() => {
            if (index++ == items.length) {
                clearInterval(timerId);
            }
            let item = items[index];

            if (item.indexOf("category") !== -1) {
                let text = '\
                                <td class="wb smallBox"></td>\
                                <td class="wb" colspan="7">' + Ordinal.get(item).category + '</td>\
                ';
                AddLine.addItemLine(text);
                index++;
            }

            let minShop;
            let text;

            Http.get('/market.php?stage=2&item_id=' + item + '&action_id=1&island=-1')
                .pipe(
                    delay(400),
                    flatMap(xhr => {
                        var div = document.createElement('div');
                        div.innerHTML = xhr.response;
                        var cost = Storage.getCost(item);
                        minShop = Parse.parseMinShopPrice(div, cost);
                        var minItem = Parse.parseMinAdvPrice(div, item);

                        text = `
                            <td class="wb smallBox"><input type="checkbox" id="${item}"></td>
                            <td class="wb">${this.getItemLink(item, minShop.title)}</td>
                            <td class="wb">${minShop.minPrice}</td>
                            <td class="wb">${cost}</td>
                            <td class="wb">${(minItem && minItem.price) ? minItem.price - cost : "-"}</td>
                            <td class="wb" id="${item}Difference">${minShop.difference}</td>`;
                        return Http.get('/statlist.php?r=' + item)
                    })
                )
                .subscribe(xhr => {
                    var div = document.createElement('div');
                    div.innerHTML = xhr.response;

                    var resPrice = Parse.parseResPrice(div, item);
                    var isPriceGood = (minShop.minPrice - resPrice) > 10000 && minShop.minPrice / resPrice > 2;
                    var textClass = isPriceGood ? " goodPrice" : "";

                    text += '<td class="wb' + textClass + '"><a href="' + Settings.domain + '/statlist.php?r=' + item + '">' + resPrice + '</a></th>';
                    AddLine.addItemLine(text, item);
                })
        }, 1000);

    },

    findEuns(e) {
        e.preventDefault();
        App.result.open();
        App.blacker.show();

        let items = HighTeck.getIDs();
        var index = 0;
        var timerId = setInterval(() => {
            if (index++ === items.length) {
                clearInterval(timerId);

                var endLine = document.createElement('tr');
                endLine.innerHTML = "<td colspan='7'>End of the list</td>";
                endLine.className = 'wb';
                App.result.content.appendChild(endLine);
            }

            let itemId = items[i]
            let page = 0;
            Http.get('/market.php?stage=2&item_id=' + itemId + '&action_id=1&island=-1').subscribe(xhr => {
                var div = document.createElement('div'),
                    elems, pages;
                div.innerHTML = xhr.response;
                if (div.getElementsByTagName('li').length === 0) {
                    return
                }
                var title = div.getElementsByTagName('li')[0].parentNode.getElementsByTagName('a')[0].textContent;
                elems = div.querySelectorAll('table.wb tr');
                pages = div.querySelectorAll('br ~ center b a');
                var sellEunPrice = Math.floor(+div.querySelector("li b").textContent.slice(0, -4) * 0.9);
                var maxPrice = sellEunPrice * localStorage.maxPrice;
                var minPrice = sellEunPrice * Settings.eun.minPrice;
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
                    itemLink.innerHTML = this.getItemLink(itemId, title) + "(" + pricePerEun + ")";
                    itemLink.className = 'wb';
                    elems[i].insertBefore(itemLink, td[0]);
                    App.result.content.appendChild(elems[i]);
                }
            })
        }, 1000);
    },

    getItemLink(itemId, title) {
        return '<b><a href="' + Settings.domain + '/item.php?item_id=' + itemId + '">' + title + '</a></b>';
    },
}