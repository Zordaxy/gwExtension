import { Settings } from "js/settings";
import { Blacker } from "js/widgets/blacker";
import { Search } from 'js/search';
import { AutoPublic } from 'js/autoPublic';
import { Menu } from "js/widgets/menu";
import { Result } from "js/widgets/result";
import { Eco } from "js/features/eco";
import { BagSell } from "js/features/bagSell";
import { Statistics } from "../features/statistics";
import { Rent } from "../features/rent";
import { Realty } from "../features/realty";

export const Widgets = {
    init(app) {
        app.blacker = new Blacker();
        app.result = new Result(app.blacker);

        // Built here (not at module load) so it reads Settings after
        // Settings.load() has applied the user's saved showButtons overrides,
        // and so the document.* conditions run against the ready DOM.
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
                action: () => AutoPublic.showAdvertisement()
            },
            {
                condition: Settings.showButtons.countShop && document.querySelector("form[action='/objectedit.php']"),
                label: 'countShop',
                action: Search.findShopPrices
            },
            {
                condition: document.querySelector('[action="object-hdo.php"]'),
                label: 'rent',
                action: () => new Rent().init()
            },
            {
                condition: Settings.showButtons.sortProperties && window.location.pathname.includes('info.realty.php'),
                label: 'sortProperties',
                action: () => new Realty().sortProperties()
            }
        ];

        // Loop through the configuration and create menus
        buttonConfig.forEach(({ condition, label, action }) => {
            if (condition) {
                new Menu(label, action);
            }
        });
    }
}
