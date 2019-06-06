define(['settings', "text!templates/settings.html"], function (settings, settingsTemplate) {
    let blacker;
    let result;
    let settingsTab;

    function Blacker () {}

    Blacker.prototype = {
        init: function () {
            this._blacker = document.createElement('div');
            this._blacker.className = 'blacker';
            this._blacker.onclick = () => {
                this._blacker.style.display = 'none';
                result.close();
                if (settingsTab) {
                    settingsTab.hide();
                }
            };
            document.body.appendChild(this._blacker);
        },
        show: function () {
            if (this._blacker) {
                this._blacker.style.display = 'block';
            }
        },
        hide: function () {
            if (this._blacker) {
                this._blacker.style.display = 'none';
            }
        }
    };
    blacker = new Blacker();


    function Result() {}
    Result.prototype = {
        init: function () {
            let html = '\
                    <table class="item-finder__table">\
                        <thead>\
                            <tr><th colspan="7">Результати пошуку <a href="#" id="closeResult" class="item-finder__search-results-close">закрити</span></th></tr>\
                            <tr class="colspan">\
                                <th class="smallBox"></th>\
                                <th class="item">Предмет</th>\
                                <th class="cost">Маг Ціна</th>\
                                <th class="cost">Собівартість</th>\
                                <th class="cost">Оголошення</th>\
                                <th class="dur">Різниця</th>\
                                <th class="cost">Ресурс</th>\
                            </tr>\
                        </thead>\
                        <tbody class="item-finder__search-results-holder">\
                        </tbody>\
                    </table>\
                ';
            this._result = document.createElement('div');
            this._result.className = 'item-finder__search-results';
            this._result.innerHTML = html;
            this.content = this._result.querySelector('.item-finder__search-results-holder');
            this._result.querySelector('.item-finder__search-results-close').onclick = this.close();
            document.body.appendChild(this._result);
            document.getElementById("closeResult").onclick = () => {
                result.close();
            }
        },

        close: function (e) {
            if (e) e.preventDefault();
            this._result.style.display = 'none';
            blacker.hide();
        },

        open: function () {
            this.content.innerHTML = '';
            this._result.style.display = 'block';
        }
    };
    result = new Result();

    function Settings() {}

    Settings.prototype = {
        show: function () {
            blacker.show();
            this._settings = document.createElement('div');
            this._settings.setAttribute('id', 'settings');
            this._settings.setAttribute('style', 'position:absolute;width:220px;left:35%;top:35%;padding:10px;background:#d0eed0;color:black;z-index:1000;');
            this._settings.innerHTML = settingsTemplate;
            document.getElementsByTagName('body')[0].appendChild(this._settings);

            localStorage.island = localStorage.island || settings.island;
            localStorage.maxPrice = localStorage.maxPrice || settings.eun.maxPrice;
            document.getElementById("cIsland").value = localStorage.island;
            document.getElementById("cMaxPrice").value = localStorage.maxPrice;

            Object.keys(settings.resources).forEach(resource => {
                localStorage[resource] = localStorage[resource] || settings.resources[resource];
                document.getElementById(resource).value = localStorage[resource];
            });
        },
        hide: function (e) {
            if (e) e.preventDefault();
            this._settings.parentNode.removeChild(this._settings);
            console.log("Triggered");

            // let _settings = document.getElementById("settings");
            // _settings.innerHTML = '';
            blacker.hide();
        }
    };
    settingsTab = new Settings();

    function Menu() {
        this._setHolder();
    }
    Menu.prototype = {
        _setHolder: function () {
            var chat = document.querySelector('#chathref');
            this.holder = chat ? chat.parentNode : null
        },

        add: function (html, callback) {
            if(this.holder) {
                var separator = document.createTextNode(' | ');
                this.holder.appendChild(separator);

                var el = document.createElement('a');
                el.innerHTML = html;
                el.href = '#';
                el.style.textDecoration = 'none';
                el.onclick = callback;
                this.holder.appendChild(el);
            }
        },
    };

    return {
        Menu: Menu,
        blacker: blacker,
        result: result,
        settingsTab: settingsTab
    }
});
