import { Settings } from "./settings";
import { Storage } from "./storage";
import { Search } from './search';
import { AutoPublic } from './autoPublic';
import { ActionButtons } from './actionButtons'
import { ParseTransactions } from "./parseTransactions";
import { Menu } from "./widgets/menu";
import { Blacker } from "./widgets/blacker";
import { Result } from "./widgets/result";
import { SettingsTab } from "./widgets/settingsTab";

export const App = {
    init() {
        this.initWidgets();
        // this.initSettingsMenu();
        this.initSellForm();
        this.initBuildingsPage();
        // ActionButtons.init();
        ParseTransactions.init();
    },

    initWidgets() {
        this.blacker = new Blacker();
        this.result = new Result(this.blacker);

        if (Settings.showButtons.prices) {
            new Menu('check prices', Search.findStatistic.bind(Search));
        }

        if (Settings.showButtons.eun) {
            new Menu('EUN', Search.findEuns);
        }

        if (Settings.showButtons.bag && document.getElementById("setswitch")) {
            new Menu('count bag', Search.findBagList.bind(Search));
        }

        if (Settings.showButtons.advertisement) {
            new Menu('advertisements', AutoPublic.showAdvertisement.bind(AutoPublic));
        }

        if (Settings.showButtons.Settings && document.querySelector("form[action='/objectedit.php']")) {
            new Menu('countShop', Search.findShopPrices.bind(Search));
        }

        if (Settings.showButtons.settings) {
            this.settingsTab = new SettingsTab(this.blacker);
            new Menu('settings', this.settingsTab.show());
        }

        new Menu('render rent', Search.parseHouseList.bind(Search));
    },

    initSellForm() {
        let priceField = document.getElementsByName("submitprice");
        if (priceField.length) {
            priceField[0].value = Storage.getPrice()
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
    },

    initBuildingsPage() {
        let firstMyBuilding = document.querySelector("a[href='/object.php?id=" + 120158 + "']");
        if (firstMyBuilding && !document.getElementById("mapdiv")) {
            let buildingTable = firstMyBuilding.closest('table');
            Search.findBuildings(buildingTable)
        }
    },
}