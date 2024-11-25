import { Settings } from "js/settings";
import { Blacker } from "js/widgets/blacker";
import { Search } from 'js/search';
import { AutoPublic } from 'js/autoPublic';
import { Menu } from "js/widgets/menu";
import { Result } from "js/widgets/result";
import { SettingsTab } from "js/widgets/settingsTab";
import { Eco } from "js/features/eco";
import { BagSell } from "js/features/bagSell";
import { Statistics } from "../features/statistics";
import { Rent } from "../features/rent";

const buttonConfig = [
    {
        condition: Settings.showButtons.prices,
        label: 'check prices',
        action: () => new Statistics().findStatistic()
    },
    {
        condition: Settings.showButtons.bag && document.getElementById("setswitch"),
        label: 'bag sell',
        action: () => new BagSell().findBagList()
    },
    {
        condition: Settings.showButtons.eco && document.getElementById("setswitch"),
        label: 'eco',
        action: () => new Eco().ecoSale()
    },
    {
        condition: Settings.showButtons.advertisement,
        label: 'advertisements',
        action: AutoPublic.showAdvertisement
    },
    {
        condition: Settings.showButtons.countShop && document.querySelector("form[action='/objectedit.php']"),
        label: 'countShop',
        action: Search.findShopPrices
    },
    {
        condition: Settings.showButtons.settings,
        label: 'settings',
        action: () => {
            const settingsTab = new SettingsTab(this.blacker);
            return settingsTab.show();
        }
    },
    {
        condition: document.querySelector('[action="object-hdo.php"]'),
        label: 'rent',
        action: () => new Rent().init()
    }
];

export const Widgets = {
    init(app) {
        app.blacker = new Blacker();
        app.result = new Result(app.blacker);

        // Loop through the configuration and create menus
        buttonConfig.forEach(({ condition, label, action }) => {
            if (condition) {
                new Menu(label, action);
            }
        });
    }
}
