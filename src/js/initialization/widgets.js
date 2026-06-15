import { Settings } from "js/settings";
import { Blacker } from "js/widgets/blacker";
import { Search } from 'js/search';
import { AutoPublic } from 'js/autoPublic';
import { Menu } from "js/widgets/menu";
import { Result } from "js/widgets/result";
import { Statistics } from "../features/statistics";
import { Rent } from "../features/rent";
import { Realty } from "../features/realty";
import { ItemControls } from "./itemControls";

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
                condition: Settings.showButtons.advertisement,
                label: 'advertisements',
                action: () => AutoPublic.showAdvertisement()
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

        // countShop now lives next to "apply all" in the shop table header.
        Search.init();

        // bag sell / eco now live in the "Предметы с собой" table header.
        ItemControls.init();
    }
}
