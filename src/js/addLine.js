import { Storage } from './storage';
import { Http } from './http';
import { Settings } from './settings';
import { App } from './app';

export const AddLine = {
    appendShopCount(row, minShop, itemId) {
        let cost = Storage.getCost(itemId);

        let countTd = document.createElement('td');
        let profit = minShop.minPrice - cost;

        // let currentPrice = row.querySelectorAll('td input')[2].value;
        // let needChange = (!Settings.friends.includes(minShop.shopOwner) || minShop.minPrice !== currentPrice) &&
        //     profit > 2500;

        profit = profit > 0 ? "<span class='green'>+" + profit + "</span>" : "<span class='red'>" + profit + "</span>";
        
        // if (needChange) {
            countTd.setAttribute("seller", minShop.shopOwner);
            countTd.setAttribute("newPrice", minShop.minPrice);
            countTd.setAttribute("noShopOffers", minShop.noShopOffers);
            minShop.minPrice = !minShop.noShopOffers ? "<span class='green'>" + minShop.minPrice + "</span>" : "<span class='brown'>" + minShop.minPrice + "</span>";
            countTd.onclick = this._changeShopPrice;
        // }

        countTd.innerHTML = minShop.minPrice + "(" + profit + ") " + minShop.shopOwner;
        row.appendChild(countTd);
    },

    appendAddLink(row, url, durability1, durability2) {
        if (!url || !row) {
            return;
        }

        let referenceContainer = document.createElement('a');
        referenceContainer.href = url;
        referenceContainer.style="text-decoration:none;font-weight:bold;color:#007700";
        referenceContainer.innerText = 'rent'; 

        referenceContainer.onclick = () => {
            Storage.setDurability(1, durability1);
            Storage.setDurability(2, durability2);
        }
        row.appendChild(referenceContainer);
    },

    _changeShopPrice(event) {
        const eventElement = event.target.closest('td');
        const isSellerFriend = Settings.friends.includes(eventElement.getAttribute("seller"));
        const noShopOffers = eventElement.getAttribute("noShopOffers") === 'true' ? true : false;

        let price = eventElement.getAttribute("newPrice");

        if (noShopOffers) {
            price = price - 1001;
        } else if (!isSellerFriend) {
            price = Math.floor((price - 1) / 10) * 10;
        }

        event.target.closest('tr').querySelectorAll('td input')[2].value = price;
    },

    appendAdvertisementData(lineId, price, seller, cost) {
        let describtionText = document.getElementById(lineId).getElementsByTagName('td')[4].textContent;
        let startIndex = describtionText.indexOf("Предмет выставлен на продажу за $");
        let isSellerFriend = Settings.friends.includes(seller);

        let lessPrice = Math.floor((price - 1) / 10) * 10;
        let nameTd = document.getElementById(lineId).getElementsByTagName('td')[2];
        let describtionTd = document.getElementById(lineId).getElementsByTagName('td')[4];

        let describtionSpan = document.createElement('span');
        let nameSpan1 = document.createElement('span');
        let nameSpan2 = document.createElement('span');
        let setLess, setSame;

        if (startIndex > 0) {
            let myPrice = describtionText.substring((startIndex + 33), (describtionText.indexOf("\n")));
            let more = "[" + cost + "] More than " + seller + " on " + (myPrice - price) + " (" + price + ")";
            let same = "[" + cost + "] Same as " + seller + " (" + price + ")";
            setLess = "Set less(" + (myPrice - lessPrice) + ") " + lessPrice + "<br>";
            setSame = "Set same(" + (myPrice - price) + ") " + price;

            if (!isSellerFriend) {
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
        let price = event.target.getAttribute("set-price");
        let url = event.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('td')[4].getElementsByTagName('a')[0].href;
        Storage.setPrice(price);

        if (url.indexOf("market-i") > 0) {
            Http.get(url);
        }

        setTimeout(() => {
            let middleClick = new MouseEvent("click", { "button": 1, "which": 1 });
            let link = [].filter.call(document.getElementsByTagName('a'), elem => {
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

    _selectItem(event) {
        let checkBox = event.target || event.srcElement;
        checkBox.parentNode.parentNode.style.backgroundColor = checkBox.checked ? "lightGreen" : "white";
        Storage.saveItem(checkBox.id);
    },
}