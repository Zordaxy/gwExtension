import { ActionButtons } from "./features/actionButtons";
import { ParseTransactions } from "./parseTransactions";
import { ObjectEdit } from "./initialization/objectEdit";
import { SellForm } from "./initialization/SellForm";
import { Widgets } from "./initialization/widgets";
import { RealtyShopBump } from './features/realtyShopBump';
import { Realty } from './features/realty';
import { ShopBumpBridge } from './shopBumpBridge';

export const App = {
  init() {
    Widgets.init(this);
    SellForm.init();
    ObjectEdit.init();
    // ParseTransactions.init();
    ActionButtons.init();
    Realty.addMoneyTotal();
    RealtyShopBump.init();
    ShopBumpBridge.init();
  },
};
