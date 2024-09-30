import { Settings } from 'js/settings';
import { Storage } from 'js/storage';

export class Rent {
    // Items should be located in house
    init = () => {
        const itemsList = Array.from(document.querySelectorAll('[id="extract_items_div"] [itemtype="art"]'));
        itemsList.forEach((item) => {
            const itemId = item.href.substring(item.href.lastIndexOf("item_id=") + "item_id=".length); // 'chinook'
            const [durability1, durability2] = item.parentNode.querySelector('font').innerText.split('/'); // 15/50

            const url = `${Settings.domain}/market-p.php?
                stage=2
                &item_id=${itemId}
                &action_id=3`;
            const row = item.parentNode.parentNode;

            if (!row || !url) {
                console.error(`No data for ${item}. Row: ${row}, url: ${url}`);
                return;
            }

            const linkNode = this.#appendAddLink(url, durability1, durability2);
            row.appendChild(linkNode);
        });
    }

    #appendAddLink(url, durability1, durability2) {
        let referenceContainer = document.createElement('a');
        referenceContainer.href = url;
        referenceContainer.style = "text-decoration:none;font-weight:bold;color:#007700";
        referenceContainer.innerText = 'rent';

        referenceContainer.onclick = () => {
            Storage.setDurability(1, durability1);
            Storage.setDurability(2, durability2);
        }

        return referenceContainer;
    }
}