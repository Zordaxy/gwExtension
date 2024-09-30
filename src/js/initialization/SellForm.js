import { Settings } from "js/settings";
import { Storage } from "js/storage.js";

export const SellForm = {

    init() {
        if (!document.querySelector('[action="/market-i.php"]')
            && (!document.querySelector('[action="/market-p.php"]'))) {
            // Not a sell form
            return;
        }


        let priceField = document.getElementsByName("submitprice");
        if (priceField.length) {
            priceField[0].value = Number(Storage.getPrice());
        }

        let funnyField = document.getElementsByName("tr_pass");
        if (funnyField.length) {
            funnyField[0].value = Settings.funnyDigit;
        }

        const durability1Selector = document.querySelector('[name="durability1"]');
        const durability2Selector = document.querySelector('[name="durability2"]');
        if (durability1Selector
            && durability2Selector
            && Storage.getDurability(2)
        ) {
            durability1Selector.value = Storage.getDurability(1);
            durability2Selector.value = Storage.getDurability(2);
            Storage.setDurability(1, null);
            Storage.setDurability(2, null);
        }

        const label = Storage.getLabel();
        if (label && document.querySelector('[action="/market-i.php"]')) {
            this.selectItemByString(label)
            Storage.setLabel(null);
        }
    },

    selectItemByString(searchString) {
        const selectElement = document.querySelector('select[name="item_iid"]');
        console.log(selectElement);
        // searchString example: "Ботинки Vanguard [EPG] [0/4]";

        for (let option of selectElement.options) {
            console.log('text', option.text, searchString);
            if (option.text === searchString) {
                console.log('set to true 1');
                option.selected = true;
                console.log('set to true 2');
                break;
            }
        }
    }
}