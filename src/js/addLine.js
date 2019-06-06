define(['storage', 'http', 'settings', 'widgets'], function (storage, http, settings, widgets) {
    function appendShopCount(row, minShop, itemId) {
        var cost = storage.getCost(itemId);

        var countTd = document.createElement('td');
        var profit = minShop.minPrice - cost;

        var currentPrice = row.querySelectorAll('td input')[2].value;
        var needChange = (!settings.friends.includes(minShop.shopOwner) || minShop.minPrice !== currentPrice)
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
    }

    function _changeShopPrice(event) {
        var isSellerFriend = settings.friends.includes(event.target.closest('td').getAttribute("seller"));
        var price = event.target.closest('td').getAttribute("newPrice");
        price = isSellerFriend ? price : Math.floor((price - 1) / 10) * 10;

        event.target.closest('tr').querySelectorAll('td input')[2].value = price;
    }

    function appendAdvertisementData(lineId, price, seller, cost) {
        var describtionText = document.getElementById(lineId).getElementsByTagName('td')[4].textContent;
        var startIndex = describtionText.indexOf("Предмет выставлен на продажу за $");
        var isSellerFriend = settings.friends.includes(seller);

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
    }

    function _changePrice(event) {
        var price = event.target.getAttribute("set-price");
        var url = event.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('td')[4].getElementsByTagName('a')[0].href;
        storage.setPrice(price);

        if (url.indexOf("market-i") > 0) {
            var callOut = function (url) {
                return http.ajaxQuery(url, 'GET');
            };
            callOut(url);
        }

        setTimeout(function () {
            var middleClick = new MouseEvent("click", {"button": 1, "which": 1});
            var link = [].filter.call(document.getElementsByTagName('a'), function (elem) {
                return elem.innerHTML === "sell";
            })[0];

            link.dispatchEvent(middleClick);
        }, 800);
    }

    function addItemLine(text, itemId) {
        let itemLine = document.createElement('tr');
        itemLine.innerHTML = text;

        widgets.result.content.appendChild(itemLine);

        if (itemId) {
            let checkBox = document.getElementById(itemId);
            checkBox.onclick = _selectItem;

            if (storage.hasItem(itemId)) {
                checkBox.parentNode.parentNode.style.backgroundColor = "lightGreen";
                checkBox.checked = true;
            }
        }
    }

    function _selectItem(e) {
        e = e || window.event;
        let checkBox = e.target || e.srcElement;
        if (checkBox.checked) {
            checkBox.parentNode.parentNode.style.backgroundColor = "lightGreen";
            storage.saveItem(checkBox.id);
        } else {
            checkBox.parentNode.parentNode.style.backgroundColor = "white";
            storage.removeItem(checkBox.id);
        }
    }

    return {
        appendAdvertisementData: appendAdvertisementData,
        appendShopCount: appendShopCount,
        addItemLine: addItemLine
    }
});
