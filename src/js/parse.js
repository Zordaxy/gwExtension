import { Storage } from './storage';
import { Settings } from './settings';
import { Ordinal } from '../data/ordinal';

export const Parse = {
    parseMinAdvPrice(div, itemId) {
        let elems = div.querySelectorAll('table.wb tr');
        let item = Ordinal.get(itemId);
        if (item) {
            let result = null;
            let duration = item.duration;
            for (var i = 3, l = elems.length; i < l; i++) {
                var td = elems[i].getElementsByTagName('td');
                if (!td || !td[1]) {
                    continue;
                }
                var dur = td[1].textContent;
                var island = td[3].textContent.slice(1, 2);


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
        var result = { difference: '-' };
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

    parseResPrice(div, itemId) {
        var prices = [];
        var trs = div.querySelector("a[href='/stats.php']").parentNode.querySelector("table td").nextElementSibling.getElementsByTagName("tr");
        for (var i = 0; i < trs.length; i++) {
            if (trs[i].children[2]) {
                var price = +trs[i].children[2].textContent.slice(2, -1);
                if (price) {
                    prices.push(price);
                }
            }
        }
        return prices.length ? (Math.min.apply(Math, prices) - Storage.getCost(itemId)) : "-";
    },
}
