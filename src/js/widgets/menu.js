export class Menu {
    constructor(html, callback) {
        let chat = document.querySelector('#chathref');
        if (chat) {
            chat.parentNode.appendChild(document.createTextNode(' | '));

            this._element = document.createElement('a');
            this._element.innerHTML = html;
            this._element.href = '#';
            this._element.style.textDecoration = 'none';
            this._element.onclick = callback;
            chat.parentNode.appendChild(this._element);
        }
    }

    get element() {
        return this.element;
    }
};