import { Settings } from "./settings";
import { Storage } from "./storage";
import { Menu, Result, Blacker, SettingsTab } from "./widgets";
import { Search } from './search';
import { AutoPublic } from './autoPublic';

export const App = {
    init() {
        this.initWidgets();
        this.initMenu();
        this.initEunMenu();
        this.initBagMenu();
        this.initAdvertisementMenu();
        // this.initSettingsMenu();
        this.initSellForm();
        this.initBuildingsPage();
        this.initShopPriceMenu();
        this.initFightButtons();
        this.initParseAG();
    },

    initWidgets() {
        this.blacker = new Blacker();
        this.result = new Result(this.blacker);
    },

    initSellForm() {
        var priceField = document.getElementsByName("submitprice");
        if (priceField.length) {
            priceField[0].value = Storage.getPrice()
        }

        var funnyField = document.getElementsByName("tr_pass");
        if (funnyField.length) {
            funnyField[0].value = Settings.funnyDigit;
        }
    },

    initBuildingsPage() {
        var selector = "a[href='/object.php?id=" + 120158 + "']";
        var firstMyBuilding = document.querySelector(selector);
        var isBuildingsPage = firstMyBuilding && !document.getElementById("mapdiv");

        if (isBuildingsPage) {
            var buildingTable = firstMyBuilding.closest('table');
            Search.findBuildings(buildingTable)
        }
    },

    initMenu() {
        this.menu = new Menu();
        this.menu.add('check prices', Search.findStatistic.bind(Search));
    },

    initEunMenu() {
        this.menu = new Menu();
        this.menu.add('EUN', Search.findEuns);
    },

    initBagMenu() {
        if (document.getElementById("setswitch")) {
            this.menu = new Menu();
            this.menu.add('count bag', Search.findBagList.bind(Search));
        }
    },

    initAdvertisementMenu() {
        AutoPublic.init();
        this.menu = new Menu();
        this.menu.add('advertisements', AutoPublic.showAdvertisement.bind(AutoPublic));
    },

    initSettingsMenu() {
        this.menu = new Menu();
        this.settingsTab = new SettingsTab(this.blacker);
        this.menu.add('settings', this.settingsTab.show());
    },

    initShopPriceMenu() {
        let isShop = document.querySelector("form[action='/objectedit.php']");
        if (isShop) {
            this.menu = new Menu();
            this.menu.add('countShop', Search.findShopPrices.bind(Search));
        }
    },

    initFightButtons() {
        document.onkeydown = evt => {
            evt = evt || window.event; 
            let ret = true;
            if ((evt.keyCode === 100) || ((evt.keyCode === 32) && (typeof chatactive === 'undefined' || chatactive === 0))) {
                var turn = document.querySelector("form[name=battleform] a");
                var update = document.querySelector("a[href='javascript:void(updatedata())']");
                var fontName = document.querySelector('font[color=F7941D]');
                var map = document.querySelector('a[href="/map.php"]');

                if (turn) {
                    turn.click();
                    ret = false;
                }
                if (update) {
                    update.click();
                    ret = false;
                }
                if (fontName && map) {
                    map.click();
                    ret = false;
                }
            }
        }
    },

    initParseAG() {
        let nickTag = document.querySelector("[id=namespan] b");
        if (nickTag) {
            if (nickTag.innerText === "A-g") {
                this.menu = new Menu();
                this.menu.add('count AG Sells', parseAG.getPage);
            }

        }
    },
}