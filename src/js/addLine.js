import { Storage } from './storage';
import { Http } from './http';
import { Settings } from './settings';
import { App } from './app';

// Minimum acceptable profit before a shop offer is flagged as a thin margin:
// 4k for items priced under 100k, 6k from 100k up.
const minMargin = (price) => (price < 100000 ? 4000 : 6000);

export const AddLine = {
    appendShopCount(row, minShop, itemId) {
        const cost = Storage.getCost(itemId) || 0;
        const minPrice = Number(minShop.minPrice);
        const profit = minPrice - cost;

        // Thin margin → not worth chasing the market. Flag it red and, when
        // applied, price it at twice cost instead of matching the competitor.
        const isThin = cost > 0 && profit < minMargin(minPrice);
        const expected = isThin
            ? Math.round(cost * 2)
            : this._adjustedPrice(minPrice, minShop);

        const priceClass = isThin ? 'red' : minShop.isNoOffers ? 'brown' : 'green';
        const profitText =
            profit > 0
                ? `<span class='green'>+${profit}</span>`
                : `<span class='red'>${profit}</span>`;

        const countTd = document.createElement('td');
        countTd.setAttribute('seller', minShop.seller);
        countTd.setAttribute('newPrice', minPrice);
        countTd.setAttribute('isNoOffers', minShop.isNoOffers);
        countTd.dataset.expected = expected;
        countTd.onclick = this._changeShopPrice;
        countTd.innerHTML = `<span class='${priceClass}'>${minPrice}</span>(${profitText}) ${minShop.seller}`;

        row.appendChild(countTd);
        this._markShopRow(countTd);
    },

    // Price we'd set when matching the cheapest competitor: undercut the gos
    // offer by 1001, round non-friends down to the nearest 10, leave friends as-is.
    _adjustedPrice(minPrice, minShop) {
        if (minShop.isNoOffers) {
            return minPrice - 1001;
        }
        if (!Settings.friends.includes(minShop.seller)) {
            return Math.floor((minPrice - 1) / 10) * 10;
        }
        return minPrice;
    },

    _changeShopPrice(event) {
        const cell = event.target.closest('td');
        cell.closest('tr').querySelectorAll('td input')[2].value = Number(cell.dataset.expected);
        AddLine._markShopRow(cell);
    },

    // Show a green check on the offer cell when the sell price already equals
    // the recommended price; remove it otherwise.
    _markShopRow(cell) {
        cell.querySelector('.saved-price--ok')?.remove();

        const sellInput = cell.closest('tr').querySelectorAll('td input')[2];
        if (sellInput && Number(sellInput.value) === Number(cell.dataset.expected)) {
            const ok = document.createElement('span');
            ok.className = 'saved-price--ok';
            ok.textContent = ' ✓';
            ok.title = 'Sell price matches the recommended price';
            cell.appendChild(ok);
        }
    },

    // "apply all" button on the shop table header: writes the recommended sell
    // price (matched competitor, or twice cost for thin margins) into every
    // already-processed row, then refreshes the checks. Starts disabled and is
    // returned so the caller can enable it once every row has been checked.
    appendShopApplyAll(table) {
        const header = [...table.rows].find((r) => r.textContent.includes('Цена продажи'));
        if (!header) {
            return null;
        }

        const button = document.createElement('button');
        button.type = 'button'; // inside a <form> — must not submit it
        button.textContent = 'apply all';
        button.className = 'apply-all apply-all--shop';
        button.disabled = true; // enabled once all offers are fetched
        button.onclick = () => {
            table.querySelectorAll('td[data-expected]').forEach((cell) => {
                cell.closest('tr').querySelectorAll('td input')[2].value = Number(cell.dataset.expected);
                this._markShopRow(cell);
            });
        };

        const td = document.createElement('td');
        td.appendChild(button);
        header.appendChild(td);

        return button;
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
                checkBox.parentNode.parentNode.classList.add("row--selected");
                checkBox.checked = true;
            }
        }

        return itemLine;
    },

    _selectItem(event) {
        let checkBox = event.target || event.srcElement;
        let row = checkBox.parentNode.parentNode;
        row.classList.toggle("row--selected", checkBox.checked);
        row.classList.toggle("row--clear", !checkBox.checked);
        Storage.saveItem(checkBox.id);
    },
}