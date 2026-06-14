import { ActionButtons } from "./features/actionButtons";
import { ParseTransactions } from "./parseTransactions";
import { ObjectPrices } from "./initialization/objectPrices";
import { SellForm } from "./initialization/SellForm";
import { Widgets } from "./initialization/widgets";

export const App = {
  init() {
    Widgets.init(this);
    SellForm.init();
    ObjectPrices.init();
    // ParseTransactions.init();
    ActionButtons.init();
    // this.initSettingsMenu();
  },
};
