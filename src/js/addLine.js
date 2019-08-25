import { Storage } from './storage';
import { ajaxQuery } from './http';
import { Settings } from './settings';
import { App } from './app';

export const AddLine = {
    appendShopCount(row, minShop, itemId) {
        var cost = Storage.getCost(itemId);

        var countTd = document.createElement('td');
        var profit = minShop.minPrice - cost;

        var currentPrice = row.querySelectorAll('td input')[2].value;
        var needChange = (!Settings.friends.includes(minShop.shopOwner) || minShop.minPrice !== currentPrice)
            && profit > 2500;

        profit = profit > 0 ? "<span class='green'>+" + profit + "</span>" : "<span class='red'>" + profit + "</span>";

        if (needChange) {
            countTd.setAttribute("seller", minShop.shopOwner);
            countTd.setAttribute("newPrice", minShop.minPrice);
            minShop.minPrice = "<span class='green'>" + minShop.minPrice + "</span>";
            countTd.onclick = _changeShopPrice;
        }

        countTd.innerHTML = minShop.minPrice + "(" + profit + ") " + minShop.shopOwner;
        row.appendChild(countTd);
    },

    _changeShopPrice(event) {
        var isSellerFriend = Settings.friends.includes(event.target.closest('td').getAttribute("seller"));
        var price = event.target.closest('td').getAttribute("newPrice");
        price = isSellerFriend ? price : Math.floor((price - 1) / 10) * 10;

        event.target.closest('tr').querySelectorAll('td input')[2].value = price;
    },

    appendAdvertisementData(lineId, price, seller, cost) {
        var describtionText = document.getElementById(lineId).getElementsByTagName('td')[4].textContent;
        var startIndex = describtionText.indexOf("Предмет выставлен на продажу за $");
        var isSellerFriend = Settings.friends.includes(seller);

        var lessPrice = Math.floor((price - 1) / 10) * 10;
        var nameTd = document.getElementById(lineId).getElementsByTagName('td')[2];
        var describtionTd = document.getElementById(lineId).getElementsByTagName('td')[4];

        var describtionSpan = document.createElement('span');
        var nameSpan1 = document.createElement('span');
        var nameSpan2 = document.createElement('span');
        //var url = describtionTd.getElementsByTagName('a')[0].href;
        var setLess, setSame;

        if (startIndex > 0) {
            var myPrice = describtionText.substring((startIndex + 33), (describtionText.indexOf("\n")));
            var more = "[" + cost + "] More than " + seller + " on " + (myPrice - price) + " (" + price + ")";
            var same = "[" + cost + "] Same as " + seller + " (" + price + ")";
            //var same = "Same as " + seller + " (" + price + ")" + "<br>";
            setLess = "Set less(" + (myPrice - lessPrice) + ") " + lessPrice + "<br>";
            setSame = "Set same(" + (myPrice - price) + ") " + price;

            if (!isSellerFriend) {
                //nameSpan1.style.font = "bold";
                describtionSpan.innerHTML = more;
                nameSpan1.innerHTML = setLess;
                nameSpan1.setAttribute("set-price", lessPrice);
            } else if (myPrice > price) {
                describtionSpan.innerHTML = more;
                nameSpan1.innerHTML = setSame;
                nameSpan1.setAttribute("set-price", price);
            } else {
                describtionSpan.innerHTML = same;
            }
        } else {
            setLess = "Set less() " + lessPrice + "<br>";
            setSame = "Set same() " + price + "<br>";
            describtionSpan.innerHTML = "[" + cost + "]";
            if (!isSellerFriend) {
                nameSpan1.innerHTML = setLess;
                nameSpan1.setAttribute("set-price", lessPrice);
            } else {
                nameSpan1.innerHTML = setSame;
                nameSpan1.setAttribute("set-price", price);
            }
        }

        nameSpan1.onclick = _changePrice;
        describtionTd.insertBefore(describtionSpan, describtionTd.firstChild);
        nameTd.appendChild(nameSpan1);
        nameTd.appendChild(nameSpan2);
    },

    _changePrice(event) {
        var price = event.target.getAttribute("set-price");
        var url = event.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('td')[4].getElementsByTagName('a')[0].href;
        Storage.setPrice(price);

        if (url.indexOf("market-i") > 0) {
            var callOut = url => {
                return ajaxQuery(url, 'GET');
            };
            callOut(url);
        }

        setTimeout(() => {
            var middleClick = new MouseEvent("click", { "button": 1, "which": 1 });
            var link = [].filter.call(document.getElementsByTagName('a'), elem => {
                return elem.innerHTML === "sell";
            })[0];

            link.dispatchEvent(middleClick);
        }, 800);
    },

    addItemLine(text, itemId) {
        let itemLine = document.createElement('tr');
        itemLine.innerHTML = text;

        App.result.content.appendChild(itemLine);

        if (itemId) {
            let checkBox = document.getElementById(itemId);
            checkBox.onclick = this._selectItem;

            if (Storage.hasItem(itemId)) {
                checkBox.parentNode.parentNode.style.backgroundColor = "lightGreen";
                checkBox.checked = true;
            }
        }
    },

    _selectItem(e) {
        e = e || window.event;
        let checkBox = e.target || e.srcElement;
        if (checkBox.checked) {
            checkBox.parentNode.parentNode.style.backgroundColor = "lightGreen";
            Storage.saveItem(checkBox.id);
        } else {
            checkBox.parentNode.parentNode.style.backgroundColor = "white";
            Storage.removeItem(checkBox.id);
        }
    },
}
