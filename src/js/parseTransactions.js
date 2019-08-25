import { Http } from "./http";
import { App } from "./app";
import { Settings } from './settings';
import { Menu } from "./widgets/menu";

export const ParseTransactions = {
    init() {
        let nickTag = document.querySelector("[id=namespan] b");
        if (nickTag) {
            if (nickTag.innerText === "A-g") {
                new Menu('count AG Sells', parseAG.getPage);
            }
        }
    },

    getPage() {
        App.result.open();
        App.blacker.show();
        let finishDate = "21.11.16 20:52";

        let page = 0;
        let finishFlag = false;
        let url = Settings.domain + '/usertransfers.php?id=' + Settings.friend;

        let request = url => Http.get(url).subscribe(xhr => {
            let div = document.createElement('div');
            div.innerHTML = xhr.response;
            elements = [].filter.call(div.children, el => {
                return el.nodeName === "NOBR";
            });

            for (let element of elements) {
                let time = element.querySelector('font').innerText;
                if (time === finishDate) {
                    addEndLine();
                    finishFlag = true;
                    break;
                }
                let expr = /Передано \$([0-9]*) от/;
                let priceMatcher = element.querySelector('font').nextSibling.data.match(expr);
                if (!priceMatcher) {
                    continue;
                }

                let price = +priceMatcher[1];
                let customer = element.querySelector('a b').innerText;
                let description = element.querySelector('a').nextSibling.data;

                if (price < 25000 || price > 600000) {
                    continue;
                }

                addLine(time, price, customer, description);
            }


            if (!finishFlag) {
                if (page >= 3) {
                    // TODO Add string with too many pages deep
                    return;
                }
                let pages = div.querySelectorAll('br ~ center b a');
                request(pages[++page].href);
            }
        });
        request(url);
    },

    addLine(time, price, customer, description) {
        let text = `<td class="wb smallBox"><input type="checkbox"></td>
            <td class="wb">${time}</td>
            <td class="wb" name="sellPrice">${price}</td>
            <td class="wb">${customer}</td>
            <td class="wb">${description}</td>
            <td class="wb">' + '</td>
            <td class="wb">' + '</td>`;
        let itemLine = document.createElement('tr');
        itemLine.innerHTML = text;
        App.result.content.appendChild(itemLine);
    },

    addEndLine() {
        let sum = 0;
        let prices = document.getElementsByName("sellPrice");
        prices.forEach(el => {
            sum += +el.innerText;
        });

        let text = `<td class="wb"></td>
            <td class="wb">Продано на:</td>
            <td class="wb">${sum}</td>
            <td class="wb"></td>
            <td class="wb"></td>
            <td class="wb"></td>
            <td class="wb"></td>`;
        let itemLine = document.createElement('tr');
        itemLine.innerHTML = text;
        Initializerer.result.content.appendChild(itemLine);
    },

}