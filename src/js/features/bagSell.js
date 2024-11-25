import { Storage } from 'js/storage';
import { Parse } from 'js/parse';
import { Http } from 'js/http';
import { Ordinal } from '../../data/ordinal';

export class BagSell {
    // TODO: Add seller to label
    // TODO: Add option to set even price to label
    // TODO: Take into account min shop price
    // TODO: Better visual
    // TODO: remove duplicated code
    findBagList = () => {
        let itemsList = Array.from({ length: 60 }, (_, index) => `item_tr1_${index}`)
            .map((id) => document.querySelector(`#${id}`))
            //.map((el) => el?.href)
            .filter((el) => el)
            .map(item => {
                let curentId = item.id;
                if (!curentId) {
                    console.log("Cannot get id for:", item);
                    return false;
                }

                let itemLink = document.querySelector(`#${curentId} a`)?.href;
                let firstIndex = itemLink.indexOf("=") + 1;
                let lastIndex = (itemLink.indexOf("&") > 0) ? itemLink.indexOf("&") : null;
                let itemId = lastIndex ? itemLink.slice(firstIndex, lastIndex) : itemLink.slice(firstIndex);
                return {
                    parent: item,
                    element: Ordinal.get(itemId)
                }
            })
            .filter(x => x.element);


        let index = -1;
        let timerId = setInterval(() => {
            if (++index >= itemsList.length - 1) {
                clearInterval(timerId);
            }
            const element = itemsList[index]?.element;
            if (!element) {
                console.log(itemsList[index], index);
                debugger;
            }

            Http.get(`/market.php?stage=2&item_id=${element.id}&action_id=1&island=-1`).subscribe(xhr => {
                let div = document.createElement('div');
                div.innerHTML = xhr.response;

                let minItem = Parse.parseMinAdvPrice(div, element.id);
                if (minItem) {
                    const label = `Set to ${minItem.price}`;

                    const parent = itemsList[index].parent;
                    const title = this.#parseTitle(parent);
                    const item = Ordinal.get(element.id);
                    const searchString = `${title} [${item?.durability}/${item?.durability}]`;
                    const newPrice = Math.floor((minItem.price - 1) / 10) * 10;
                    const isMine = minItem.seller?.indexOf("Michegan") > -1;

                    const linkNode = this.#generateLink(newPrice, searchString, label, isMine);
                    parent.appendChild(linkNode);
                    // AddLine.appendAdvertisementData(curentId, minItem.price, minItem.seller, Storage.getCost(itemId));
                }
            });
        }, 400);
    }

    #generateLink(newCost, searchString, label = "sell eco", isMine = false) {
        let linkNode = document.createElement('span');
        linkNode.innerHTML = label;
        linkNode.classList.add("sell-eco");
        if (!isMine) linkNode.classList.add("green");

        linkNode.onclick = () => {
            Storage.setPrice(newCost);
            Storage.setLabel(searchString);

            setTimeout(() => {
                let middleClick = new MouseEvent("click", { "button": 1, "which": 1 });
                let link = [].filter.call(document.getElementsByTagName('a'), elem => {
                    return elem.innerHTML === "sell";
                })[0];

                link.dispatchEvent(middleClick);
            }, 400);
        }

        return linkNode;
    }

    #parseTitle(node) {
        let labelNode = node.querySelector('[itemtype="simpleitem"]');

        if (!labelNode) {
            const idSuffix = node.id.split('_').pop();
            labelNode = document.querySelector(`#item_tr1_${idSuffix}`).querySelector('[itemtype="simpleitem"]');
        }

        return labelNode?.innerHTML;
    }
}