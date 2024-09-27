import { Storage } from 'js/storage';
import { Http } from 'js/http';
import { Settings } from 'js/settings';
import { Parse } from 'js/parse';
import { AddLine } from 'js/addLine';
import { App } from 'js/app';
import { Ordinal } from 'data/ordinal';

export class Statistics {
    findStatistic = async (event) => {
        // event.preventDefault();
        Storage.getItems();

        App.result.open();
        App.blacker.show();

        let groups = Ordinal.getGroupedElements();
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (const [key, value] of Object.entries(groups)) {
            const items = value.map(x => x.id);
            await this.#renderStatisticsSection(items, key);
            await delay(400);
        }
    }

    async #renderStatisticsSection(items, key) {
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
                <td class="wb">${this.#getItemLink(itemId, minShop.title)}</td>
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
    }

    #getItemLink(itemId, title) {
        return `<b><a href="${Settings.domain}/item.php?item_id=${itemId}">${title}</a></b>`;
    }
}