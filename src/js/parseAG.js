import { Http } from "./http";
import { App } from "./app";

export const ParseAG = {
    getPage() {
        App.result.open();
        App.blacker.show();
        let person = 379129; //A-g
        let finishDate = "21.11.16 20:52";

        var page = 0;
        var finishFlag = false;
        Http.get('http://www.ganjawars.ru/usertransfers.php?id=' + person).subscribe(xhr => {
            var div = document.createElement('div'),
                elems, pages;
            div.innerHTML = xhr.response;
            elems = [].filter.call(div.children, el => {
                return el.nodeName === "NOBR"
            });
            pages = div.querySelectorAll('br ~ center b a');

            for (var i = 0, l = elems.length; i < l; i++) {
                finishFlag = parseLine(elems[i]);
                if (finishFlag) {
                    break;
                }
            }

            if (!finishFlag) {
                if (page >= 3) {
                    //TODO Add string with too many pages deep
                    return;
                }
                ++page;
                request(pages[page].href);
            }
        });
    },

    parseLine(element) {
        var time = element.querySelector('font').innerText;
        if (time === finishDate) {
            addEndLine();
            return true;
        }
        var expr = /Передано \$([0-9]*) от/;

        var priceMatcher = element.querySelector('font').nextSibling.data.match(expr);
        if (!priceMatcher) {
            return false;
        }

        var price = +priceMatcher[1];
        var customer = element.querySelector('a b').innerText;
        var description = element.querySelector('a').nextSibling.data;

        if (price < 25000 || price > 600000) {
            return false;
        }

        addLine(time, price, customer, description);
        return false;
    },

    addLine(time, price, customer, description) {
        var text = '\
                                <td class="wb smallBox"><input type="checkbox"></td>\
                                <td class="wb">' + time + '</td>\
                                <td class="wb" name="sellPrice">' + price + '</td>\
                                <td class="wb">' + customer + '</td>\
                                <td class="wb">' + description + '</td>\
                                <td class="wb">' + '</td>\
                                <td class="wb">' + '</td>\
                ';
        var itemLine = document.createElement('tr');
        itemLine.innerHTML = text;
        App.result.content.appendChild(itemLine);
    },

    addEndLine() {
        var sum = 0;
        var prices = document.getElementsByName("sellPrice");
        prices.forEach(el => {
            sum += +el.innerText;
        });

        var text = '\
                                <td class="wb"></td>\
                                <td class="wb">Продано на:</td>\
                                <td class="wb">' + sum + '</td>\
                                <td class="wb">' + '</td>\
                                <td class="wb">' + '</td>\
                                <td class="wb">' + '</td>\
                                <td class="wb">' + '</td>\
                ';
        var itemLine = document.createElement('tr');
        itemLine.innerHTML = text;
        Initializerer.result.content.appendChild(itemLine);
    },

}