﻿import { ActionButtons } from './features/actionButtons'
import { ParseTransactions } from "./parseTransactions";
import { SellForm } from "./initialization/SellForm";
import { Widgets } from "./initialization/widgets";

export const App = {
    init() {
        Widgets.init(this);
        SellForm.init();
        ParseTransactions.init();
        // ActionButtons.init();
        // this.initSettingsMenu();
    }
}