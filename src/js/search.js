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
            Http.get(`/info.realty.php?id=${owner}`).subscribe(xhr => {
                let div = document.createElement('div');
                div.innerHTML = xhr.response;

                buildings.forEach(id => {
                    let selector = `a[href='/object.php?id=${id}']`;
                    let buildingTitle = div.querySelector(selector);
                    if (buildingTitle) {
                        let buildingLine = buildingTitle.closest('tr');
                        table.appendChild(buildingLine);
                    }
                });
            });
        }
    },

    findBagList() {
        let itemsList = [];
        let index = 0;
        let timerId = setInterval(() => {
            if (index++ === 110) {
                clearInterval(timerId);
            }
            let curentId = `item_tr1_${index}`;
            if (document.getElementById(curentId)) {
                let itemLink = document.querySelector(`${curentId} a`).href;

                let firstIndex = itemLink.indexOf("=") + 1;
                let lastIndex = (itemLink.indexOf("&") > 0) ? itemLink.indexOf("&") : null;
                let itemId = lastIndex ? itemLink.slice(firstIndex, lastIndex) : itemLink.slice(firstIndex);
                itemsList.push(itemId);

                Http.get(`/market.php?stage=2&item_id=${itemId}&action_id=1&island=-1`).subscribe(xhr => {
                    let div = document.createElement('div');
                    div.innerHTML = xhr.response;
                    let minItem = Parse.parseMinAdvPrice(div, itemId);
                    if (minItem) {
                        AddLine.appendAdvertisementData(curentId, minItem.price, minItem.seller, Storage.getCost(itemId));
                    }
                });
            }
        }, 400);
    },

    parseHouseList() {
        const itemsList = Array.from(document.querySelectorAll('[id="extract_items_div"] [itemtype="art"]'));
        itemsList.forEach((item) => {
            const itemId = item.href.substring(item.href.lastIndexOf("item_id=") + "item_id=".length); // 'chinook'
            const [durability1, durability2] = item.parentNode.querySelector('font').innerText.split('/'); // 15/50


            const url = `${Settings.domain}/market-p.php?
                stage=2
                &item_id=${itemId}
                &action_id=3`;

            AddLine.appendAddLink(item.parentNode.parentNode, url, durability1, durability2);
        });
    },

    async findShopPrices() {
        const island = document.querySelectorAll('table table a b')?.[1]?.innerText?.substring(1, 2);
        if (island !== "G" && island !== "Z") {
            console.log("[Island parsing error] - island not found in shop page. Found: ", island);
            return;
        }
        let rows = document.querySelector("form[action='/objectedit.php'] table[cellpadding='4']").rows;
        let filteredRows = Array.prototype.filter.call(rows, elem => {
            return elem.querySelectorAll("td")[1] && +elem.querySelectorAll("td")[1].innerText !== 0 &&
                !isNaN(+elem.querySelectorAll("td")[1].innerText);
        });

        Http.processWithDelay(filteredRows, async (row) => {
            let inputPriceLine = row.querySelectorAll("td input[name]");
            let resourceId = inputPriceLine[0].name.slice(7, -1);

            const minShop = await Parse.parseShopsPrice(resourceId, island)

            if (minShop?.isMaxPrice) {
                await new Promise(resolve => setTimeout(resolve, 200));
                minShop.minPrice = await Parse.parseSellersPrice(resourceId, island);
            }
            AddLine.appendShopCount(row, minShop, resourceId);
        })
    },

    getIslandCode() {
        const parsedIsland = document.querySelectorAll('table table a b')?.[1]?.innerText?.substring(1, 2);
        let islandCode;

        switch(parsedIsland) {
            case "G":
                islandCode = 0;
                break;
            case "Z":
                islandCode = 1;
                break;
            default:
                islandCode = -1;
                console.log("[Selector error] - no island parsed from property config page");
                break;
        }
        return islandCode;
    },


    findStatistic(event) {
        event.preventDefault();
        Storage.getItems();

        App.result.open();
        App.blacker.show();

        let items = Ordinal.getIDs();

        let index = 0;
        let timerId = setInterval(() => {
            if (index++ >= items.length) {
                clearInterval(timerId);
            }
            let item = items[index];

            // if (item.indexOf("category") !== -1) {
            //     let text = `
            //         <td class="wb smallBox"></td>
            //         <td class="wb" colspan="7">${Ordinal.get(item).category}</td>`;
            //     AddLine.addItemLine(text);
            //     index++;
            // }

            let minShop;
            let text;

            Http.get(`/market.php?stage=2&item_id=${item}&action_id=1&island=-1`)
                .pipe(
                    delay(400),
                    flatMap(xhr => {
                        let div = document.createElement('div');
                        div.innerHTML = xhr.response;
                        let cost = Storage.getCost(item);
                        minShop = Parse.parseMinShopPrice(div, cost);
                        let minItem = Parse.parseMinAdvPrice(div, item);

                        text = `
                            <td class="wb smallBox"><input type="checkbox" id="${item}"></td>
                            <td class="wb">${Search.getItemLink(item, minShop.title)}</td>
                            <td class="wb">${minShop.minPrice}</td>
                            <td class="wb">${cost}</td>
                            <td class="wb">${(minItem && minItem.price) ? minItem.price - cost : "-"}</td>
                            <td class="wb" id="${item}Difference">${minShop.difference}</td>`;
                        return Http.get('/statlist.php?r=' + item)
                    })
                )
                .subscribe(xhr => {
                    let div = document.createElement('div');
                    div.innerHTML = xhr.response;

                    let resPrice = Parse.parseResPrice(div, item);
                    let isPriceGood = (minShop.minPrice - resPrice) > 10000 && minShop.minPrice / resPrice > 2;
                    let textClass = isPriceGood ? " goodPrice" : "";

                    text += `
                        <td class="wb${textClass}">
                            <a href="${Settings.domain}/statlist.php?r=${item}">${resPrice}</a>
                        </th>`;
                    AddLine.addItemLine(text, item);
                })
        }, 1000);
    },

    findEuns(e) {
        e.preventDefault();
        App.result.open();
        App.blacker.show();

        let items = HighTeck.getIDs();
        let index = 0;
        let timerId = setInterval(() => {
            if (index++ === items.length) {
                clearInterval(timerId);

                let endLine = document.createElement('tr');
                endLine.innerHTML = "<td colspan='7'>End of the list</td>";
                endLine.className = 'wb';
                App.result.content.appendChild(endLine);
            }

            let itemId = items[index]
            let page = 0;
            let url = `/market.php?stage=2&item_id=${itemId}&action_id=1&island=-1`;
            let request = url => Http.get(url).subscribe(xhr => {
                let div = document.createElement('div'),
                    elems, pages;
                div.innerHTML = xhr.response;
                if (div.getElementsByTagName('li').length === 0) {
                    return
                }
                let title = div.getElementsByTagName('li')[0].parentNode.getElementsByTagName('a')[0].textContent;
                elems = [...div.querySelectorAll('table tr')].filter(x => x.querySelectorAll('a b')[1] && x.querySelectorAll('a b')[1].innerText === 'Купить');
                pages = div.querySelectorAll('br ~ center b a');
                let sellEunPrice = Math.floor(+div.querySelector("li b").textContent.slice(0, -4) * 0.9);
                let maxPrice = sellEunPrice * Settings.eun.maxPrice // localStorage.maxPrice;
                let minPrice = sellEunPrice * Settings.eun.minPrice;
                if (pages.length > 1 && page < pages.length - 1) {
                    for (let i = 1, l = pages.length; i < l; i++) {
                        request(pages[i].href);
                        ++page;
                    }
                }

                for (let i = 0, l = elems.length; i < l; i++) {
                    let td = elems[i].getElementsByTagName('td'),
                        cost = td[0].textContent.replace(/[\$\,]/g, '') | 0;
                    if ((maxPrice > 0 && maxPrice < cost) || (minPrice > cost)) continue;
                    let itemLink = document.createElement('td');
                    let pricePerEun = (cost / (sellEunPrice * 1000)).toFixed(1);
                    itemLink.innerHTML = Search.getItemLink(itemId, title) + "(" + pricePerEun + ")";
                    itemLink.className = 'wb';
                    elems[i].insertBefore(itemLink, td[0]);
                    App.result.content.appendChild(elems[i]);
                }
            });
            request(url);
        }, 1000);
    },

    getItemLink(itemId, title) {
        return `<b><a href="${Settings.domain}/item.php?item_id=${itemId}">${title}</a></b>`;
    },
}