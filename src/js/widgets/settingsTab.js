import { Settings } from "../settings"

export class SettingsTab {
    constructor(blacker) {
        this.blacker = blacker;
    }
    show() {
        this.blacker.show();
        this._settings = document.createElement('div');
        this._settings.setAttribute('id', 'settingsTab');
        this._settings.setAttribute('style', 'position:absolute;width:220px;left:35%;top:35%;padding:10px;background:#d0eed0;color:black;z-index:1000;');
        this._settings.innerHTML = settingsTemplate;
        document.getElementsByTagName('body')[0].appendChild(this._settings);

        localStorage.island = localStorage.island || Settings.island;
        localStorage.maxPrice = localStorage.maxPrice || Settings.eun.maxPrice;
        document.getElementById("cIsland").value = localStorage.island;
        document.getElementById("cMaxPrice").value = localStorage.maxPrice;

        Object.keys(Settings.resources).forEach(resource => {
            localStorage[resource] = localStorage[resource] || Settings.resources[resource];
            document.getElementById(resource).value = localStorage[resource];
        });
    }
    hide(e) {
        if (e) e.preventDefault();
        this._settings.parentNode.removeChild(this._settings);
        console.log("Triggered");

        // let _settings = document.getElementById("settingsTab");
        // _settings.innerHTML = '';
        this.blacker.hide();
    }
};