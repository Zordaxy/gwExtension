import { Storage } from './storage';
import { Http } from './http';
import { Settings } from './settings';
import { Parse } from './parse';
import { AddLine } from './addLine';
import { App } from './app';
import { Ordinal } from '../data/ordinal';
import { HighTeck } from '../data/highTeck';

export const Search = {
    findBagList() {
        let itemsList = Array.from({ length: 60 }, (_, index) => `item_tr1_${index}`)
            .map((id) => document.querySelector(`#${id}`))
            //.map((el) => el?.href)
            .filter((el) => el);
        let idsList = [];

        let index = 0;
        let timerId = setInterval(() => {
            if (index++ >= itemsList.length - 1) {
                clearInterval(timerId);
            }
            let curentId = itemsList[index].id;
            let itemLink = document.querySelector(`#${curentId} a`)?.href;

            let firstIndex = itemLink.indexOf("=") + 1;
            let lastIndex = (itemLink.indexOf("&") > 0) ? itemLink.indexOf("&") : null;
            let itemId = lastIndex ? itemLink.slice(firstIndex, lastIndex) : itemLink.slice(firstIndex);
            idsList.push(itemId);




            // TODO: fix selectors
            // Http.get(`/market.php?stage=2&item_id=${itemId}&action_id=1&island=-1`).subscribe(xhr => {
            //     let div = document.createElement('div');
            //     div.innerHTML = xhr.response;

            //     // let minItem = Parse.parseMinAdvPrice(div, itemId);
            //     if (minItem) {
            //         AddLine.appendAdvertisementData(curentId, minItem.price, minItem.seller, Storage.getCost(itemId));
            //     }
            // });
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
            const count = +elem.querySelectorAll("td")[1]?.innerText;
            const resourceId = elem.querySelectorAll("td input[name]")?.[0]?.name?.slice(7, -1)
            return count !== 0 && resourceId && !isNaN(count);
        });

        Http.processWithDelay(filteredRows, async (row) => {
            let inputPriceLine = row.querySelectorAll("td input[name]");
            let resourceId = inputPriceLine[0].name.slice(7, -1);

            const parsedShops = await Parse.parseShopsPrice(resourceId);
            const localData = parsedShops[island];

            if (localData?.isNoOffers) {
                await new Promise(resolve => setTimeout(resolve, 200));
                localData.minPrice = await Parse.parseSellersPrice(resourceId, island);
            }
            AddLine.appendShopCount(row, localData, resourceId);
        })
    },

    getIslandCode() {
        const parsedIsland = document.querySelectorAll('table table a b')?.[1]?.innerText?.substring(1, 2);
        let islandCode;

        switch (parsedIsland) {
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


    async findStatistic(event) {
        event.preventDefault();
        Storage.getItems();

        App.result.open();
        App.blacker.show();

        let groups = Ordinal.getGroupedElements();
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (const [key, value] of Object.entries(groups)) {
            const items = value.map(x => x.id);
            await this.renderStatisticsSection(items, key);
            await delay(400);
        }
    },

    async renderStatisticsSection(items, key) {
        const sectionText = `<th colspan="7">${key} <a href="#" id="closeResult" class="item-finder__search-results-close">закрити</span></th>\``
            ;
        AddLine.addItemLine(sectionText);



        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (const itemId of items) {
            let minShop;
            let text;
            let response = await Http.fetchGet(`/market.php?stage=2&item_id=${itemId}&action_id=1&island=-1`)
            let cost = Storage.getCost(itemId);
            minShop = Parse.parseMinShopPrice(response, cost);
            let minItem = Parse.parseMinAdvPrice(response, itemId);

            text = `
                <td class="wb smallBox"><input type="checkbox" id="${itemId}"></td>
                <td class="wb">${Search.getItemLink(itemId, minShop.title)}</td>
                <td class="wb">${minShop.minPrice}</td>
                <td class="wb">${cost}</td>
                <td class="wb">${(minItem && minItem.price) ? minItem.price - cost : "-"}</td>
                <td class="wb" id="${itemId}Difference">${minShop.difference}</td>`;


            await delay(400);
            response = await Http.fetchGet('/statlist.php?r=' + itemId)

            let resPrice = Parse.parseResPrice(response, itemId);
            let isPriceGood = (minShop.minPrice - resPrice) > 10000 && minShop.minPrice / resPrice > 2;
            let textClass = isPriceGood ? " goodPrice" : "";

            text += `
                <td class="wb${textClass}">
                    <a href="${Settings.domain}/statlist.php?r=${itemId}">${resPrice}</a>
                </th>`;
            AddLine.addItemLine(text, itemId);
        }
    },

    getItemLink(itemId, title) {
        return `<b><a href="${Settings.domain}/item.php?item_id=${itemId}">${title}</a></b>`;
    },
}