define(['storage', 'http', 'settings', 'search', 'widgets', 'autoPublic'], function (storage, support, settings, search, widgets, autoPublic) {
    function initSellForm () {
        var priceField = document.getElementsByName("submitprice");
        if (priceField.length) {
            priceField[0].value = storage.getPrice()
        }

        var funnyField = document.getElementsByName("tr_pass");
        if (funnyField.length) {
            funnyField[0].value = settings.funnyDigit;
        }
    }

    function initBuildingsPage () {
        var selector = "a[href='/object.php?id=" + 120158 + "']";
        var firstMyBuilding = document.querySelector(selector);
        var isBuildingsPage = firstMyBuilding && !document.getElementById("mapdiv");

        if (isBuildingsPage) {
            var buildingTable = firstMyBuilding.closest('table');
            search.findBuildings(buildingTable)
        }
    }

    function initMenu () {
        this.menu = new widgets.Menu();
        this.menu.add('check prices', search.findStatistic.bind(search));
    }

    function initEunMenu () {
        this.menu = new widgets.Menu();
        this.menu.add('EUN', search.findEuns);
    }

    function initBagMenu () {
        if(document.getElementById("setswitch")){
            this.menu = new widgets.Menu();
            this.menu.add('count bag', search.findBagList.bind(search));
        }
    }

    function initAdvertisementMenu () {
        this.menu = new widgets.Menu();
        this.menu.add('advertisements', autoPublic.showAdvertisement.bind(autoPublic));
    }

    function initSettingsMenu () {
        this.menu = new widgets.Menu();
        this.menu.add('settings', widgets.settingsTab.show.bind(widgets.settingsTab));
    }

    function initShopPriceMenu () {
        let isShop = document.querySelector("form[action='/objectedit.php']");
        if (isShop) {
            this.menu = new widgets.Menu();
            this.menu.add('countShop', search.findShopPrices.bind(search));
        }
    }

    function initFightButtons() {
        document.onkeydown = function(evt) { evt = evt || window.event; ret=true;
            if ((evt.keyCode === 100) || ((evt.keyCode === 32) && (typeof chatactive === 'undefined' || chatactive === 0))) {
                var turn = document.querySelector("form[name=battleform] a");
                var update = document.querySelector("a[href='javascript:void(updatedata())']");
                var fontName = document.querySelector('font[color=F7941D]');
                var map = document.querySelector('a[href="/map.php"]');

                if(turn){
                    turn.click();
                    ret=false;
                }
                if(update){
                    update.click();
                    ret=false;
                }
                if(fontName && map){
                    map.click();
                    ret=false;
                }
            }
        }
    }

    function initParseAG () {
        let nickTag = document.querySelector("[id=namespan] b");
        if (nickTag) {
            if (nickTag.innerText === "A-g") {
                this.menu = new support.Menu();
                this.menu.add('count AG Sells', parseAG.getPage);
            }

        }
    }

    return {
        init: function () {
            initMenu();
            initEunMenu();
            initBagMenu();
            initAdvertisementMenu();
            initSettingsMenu();
            widgets.result.init();
            widgets.blacker.init();
            initSellForm();
            initBuildingsPage();
            initShopPriceMenu();
            initFightButtons();
            initParseAG();
        }
    }
});
