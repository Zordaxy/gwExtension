import { ActionButtons } from "./features/actionButtons";
import { ParseTransactions } from "./parseTransactions";
import { ObjectEdit } from "./initialization/objectEdit";
import { SellForm } from "./initialization/SellForm";
import { Widgets } from "./initialization/widgets";

export const App = {
  init() {
    Widgets.init(this);
    SellForm.init();
    ObjectEdit.init();
    // ParseTransactions.init();
    ActionButtons.init();
  },
};
