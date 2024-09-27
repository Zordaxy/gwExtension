import { Http } from './http';
import { Settings } from './settings';
import { Parse } from './parse';
import { AddLine } from './addLine';

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
    }
}