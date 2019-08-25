export class Menu {
    constructor(html, callback) {
        let chat = document.querySelector('#chathref');
        if (chat) {
            chat.parentNode.appendChild(document.createTextNode(' | '));

            this.el = document.createElement('a');
            el.innerHTML = html;
            el.href = '#';
            el.style.textDecoration = 'none';
            el.onclick = callback;
            chat.parentNode.appendChild(el);
        }
    }

    get element() {
        return this.el;
    }
};