import { App } from "../app";

export class Blacker {
    constructor() {
        this._blacker = document.createElement('div');
        this._blacker.className = 'blacker';
        this._blacker.onclick = () => {
            this._blacker.style.display = 'none';
            result.close();
            if (App.settingsTab) {
                App.settingsTab.hide();
            }
        };
        document.body.appendChild(this._blacker);
    }
    show() {
        if (this._blacker) {
            this._blacker.style.display = 'block';
        }
    }
    hide() {
        if (this._blacker) {
            this._blacker.style.display = 'none';
        }
    }
};