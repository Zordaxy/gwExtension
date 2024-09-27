import { Settings } from "js/settings";
import { Blacker } from "js/widgets/blacker";
import { Search } from 'js/search';
import { AutoPublic } from 'js/autoPublic';
import { Menu } from "js/widgets/menu";
import { Result } from "js/widgets/result";
import { SettingsTab } from "js/widgets/settingsTab";
import { Eco } from "js/features/eco";

export const Widgets = {
    init() {
        this.blacker = new Blacker();
        this.result = new Result(this.blacker);

        if (Settings.showButtons.prices) {
            new Menu('check prices', Search.findStatistic.bind(Search));
        }

        if (Settings.showButtons.bag && document.getElementById("setswitch")) {
            new Menu('count bag', Search.findBagList.bind(Search));
        }

        if (Settings.showButtons.eco && document.getElementById("setswitch")) {
            new Menu('eco', Eco.ecoSale.bind(Eco));
        }

        if (Settings.showButtons.advertisement) {
            new Menu('advertisements', AutoPublic.showAdvertisement.bind(AutoPublic));
        }

        if (Settings.showButtons.countShop && document.querySelector("form[action='/objectedit.php']")) {
            new Menu('countShop', Search.findShopPrices.bind(Search));
        }

        if (Settings.showButtons.settings) {
            this.settingsTab = new SettingsTab(this.blacker);
            new Menu('settings', this.settingsTab.show());
        }

        new Menu('render rent', Search.parseHouseList.bind(Search));
    }
}