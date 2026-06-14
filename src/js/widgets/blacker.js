import { App } from "../app";

export class Blacker {
    constructor() {
        this._blacker = document.createElement('div');
        this._blacker.className = 'blacker is-hidden';
        this._blacker.onclick = () => {
            this._blacker.classList.add('is-hidden');
            App.result.close();
        };
        document.body.appendChild(this._blacker);
    }
    show() {
        if (this._blacker) {
            this._blacker.classList.remove('is-hidden');
        }
    }
    hide() {
        if (this._blacker) {
            this._blacker.classList.add('is-hidden');
        }
    }
};