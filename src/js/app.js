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
import { Eco } from "./features/eco";
import { SellForm } from "./initialization/SellForm";
import { Widgets } from "./initialization/widgets";

export const App = {
    init() {
        Widgets.init();
        // this.initSettingsMenu();
        SellForm.init();
        // ActionButtons.init();
        // ActionButtons.highlightPokemons();
        ParseTransactions.init();
    },


}