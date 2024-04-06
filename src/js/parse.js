import { Storage } from './storage';
import { Settings } from './settings';
import { Ordinal } from '../data/ordinal';
import { Http } from './http';

export const Parse = {
    parseMinAdvPrice(div, itemId) {
        let elems = div.querySelectorAll('table.wb tr');
        let item = Ordinal.get(itemId);
        if (item) {
            let result = null;
            let duration = item.duration;
            for (let i = 3, l = elems.length; i < l; i++) {
                let td = elems[i].getElementsByTagName('td');
                if (!td || !td[1]) {
                    continue;
                }
                let dur = td[1].textContent;
                let island = td[3].textContent.slice(1, 2);


                if ((dur === (duration + "/" + duration)) && (island === Settings.island) && (td[4].textContent.indexOf("написать") < 0)) {
                    result = result || {};
                    result.price = td[0].textContent.replace(/[\$\,]/g, '') | 0;
                    result.seller = td[4].textContent.slice(0, td[4].textContent.indexOf(" ["));
                    break;
                }
            }
            return result
        }
        return null;
    },

    parseMinShopPrice(div, cost) {
        let result = { difference: '-' };
        if (div.getElementsByTagName('li')[2]) {
            result.minPrice = +div.getElementsByTagName('li')[2].getElementsByTagName('b')[0].textContent.slice(0, -1).replace(',', '');
            result.shopOwner = div.getElementsByTagName('li')[2].getElementsByTagName('b')[1].textContent;
            if (cost) {
                result.difference = +result.minPrice - cost;
            }
            result.title = div.getElementsByTagName('li')[0].parentNode.getElementsByTagName('a')[0].textContent;
        } else {
            result.title = div.querySelector(".wb b a[href]").textContent;
        }
        return result;
    },

    async parseShopsPrice(resourceId, island) {
        const response = await Http.fetchGet(`/statlist.php?r=${resourceId}&type=i`)

        const listSelector = response.querySelectorAll('center table table tr');
        const list = [...listSelector];

        if (list.length <=1) {
            console.log("[Selector error] - shops list does not contain entries");
            return { minPrice: null, isMaxPrice: true, shopOwner: 'Nobody'};
        }

        list.shift();
        let shopOwner;

        const minPriceElement = list.find((tr, index) => {
            const shopIsland = tr.querySelector("a").innerText.substring(1,2);
            const owner = tr.querySelector("b").innerText;
            const price = tr.querySelectorAll("td")[2].innerText.trim().substring(1);
            if (!shopIsland || !owner || !price) {
                console.log("[Parsing error] - specific shop data is missing");
                return false;
            }

            if (shopIsland !== island || owner === "Michegan") {
                return false;
            }

            shopOwner = owner;
            return true;
        });
        const minPrice = minPriceElement?.querySelectorAll("td")[2].innerText.trim().substring(1);
        const title = response.querySelector('center table a b').innerText;

        return { minPrice, title, shopOwner: shopOwner || "Michegan", isMaxPrice: !minPrice };
    },

    async parseSellersPrice(resourceId, island) {
        const response = await Http.fetchGet(`/market.php?buy=1&item_id=${resourceId}`);

        const gosShopRawPrice = response.querySelector('table [class="greengraybg"] div b')?.innerText;
        if (!gosShopRawPrice) {
            console.log('[Parsing errors] - cannot parse gos price');
            return;
        }

        const gosShopPrice = gosShopRawPrice.substring(0, gosShopRawPrice.length - 1).split(',').join('');
        return +gosShopPrice;
    },

    parseResPrice(div, itemId) {
        let prices = [];
        let trs = div.querySelector("a[href='/stats.php']").parentNode.querySelector("table td").nextElementSibling.getElementsByTagName("tr");
        for (let i = 0; i < trs.length; i++) {
            if (trs[i].children[2]) {
                let price = +trs[i].children[2].textContent.slice(2, -1);
                if (price) {
                    prices.push(price);
                }
            }
        }
        return prices.length ? (Math.min.apply(Math, prices) - Storage.getCost(itemId)) : "-";
    },
}