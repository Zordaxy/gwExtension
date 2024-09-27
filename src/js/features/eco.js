import { Storage } from 'js/storage';
import { Settings } from 'js/settings';

export class Eco {
    ecoSale = () => {
        const items1List = Array.from({ length: 60 }, (_, index) => `item_tr1_${index}`);
        const items2List = Array.from({ length: 60 }, (_, index) => `item_tr2_${index}`);


        const itemsList = [...items1List, ...items2List]
            .map((id) => document.querySelector(`#${id}`))
            .filter(x => x)
            .map(x => ({ ref: [...x.querySelectorAll('a[href="#"]')].find(x => x?.innerText === "Продать"), parent: x }))
            .filter(x => x.ref);

        itemsList.forEach(({ ref, parent }) => {
            const str = ref.nextSibling.nodeValue.trim(); // '[ $84,821 (+10767.8 exp) ]'


            // Extract the dollar amount
            const amountMatch = str.match(/\$([0-9,]+)/);
            const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null;  // 84821

            // Extract the experience points
            const expMatch = str.match(/\+([0-9]+)\.?\d*\s*exp/);
            const experience = expMatch ? parseInt(expMatch[1]) : null;  // 10767

            const newCost = Number(experience * Settings.eco + amount).toFixed();

            const durability = this.#parseDurability(parent);

            const title = this.#parseTitle(parent);
            if (!title) return;
            const searchString = `${title} [${durability}]`;

            const linkNode = this.#generateLink(newCost, searchString)
            parent.appendChild(linkNode);
        })
    }

    #generateLink(newCost, searchString) {
        let linkNode = document.createElement('span');
        linkNode.innerHTML = "sell eco";
        linkNode.classList.add("sell-eco");

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

    #parseDurability(node) {
        const durabilityLabel = Array.from(node.querySelectorAll('div')).find(div => div.textContent.includes("Прочность предмета:"));

        if (durabilityLabel) {
            // Find the text after "Прочность предмета:" by navigating sibling nodes
            const nodes = durabilityLabel.childNodes;
            let durabilityText = null;

            // Loop through the child nodes to find the one that contains the durability value
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType === Node.TEXT_NODE && nodes[i].textContent.includes("Прочность предмета:")) {
                    // The next sibling should contain the durability info
                    const nextNode1 = nodes[i + 1];
                    const nextNode2 = nodes[i + 2];

                    durabilityText = nextNode1.textContent.trim() + nextNode2.textContent.trim();
                    break;
                }
            }

            return durabilityText;
        }
        return null;
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