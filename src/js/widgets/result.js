export class Result {
    constructor(blacker) {
        this.blacker = blacker;
        let html = '\
                    <table class="item-finder__table">\
                        <thead>\
                            <tr><th colspan="9">Результати пошуку <a href="#" id="closeResult" class="item-finder__search-results-close">закрити</a></th></tr>\
                            <tr class="colspan">\
                                <th class="smallBox"></th>\
                                <th class="item">Предмет</th>\
                                <th class="cost">Маг Ціна</th>\
                                <th class="cost">Собівартість</th>\
                                <th class="cost">Оголошення</th>\
                                <th class="dur">Різниця</th>\
                                <th class="cost">Ресурс</th>\
                                <th class="cost">Наявність</th>\
                                <th class="smallBox"></th>\
                            </tr>\
                        </thead>\
                        <tbody class="item-finder__search-results-holder">\
                        </tbody>\
                    </table>\
                ';
        this._result = document.createElement('div');
        this._result.className = 'item-finder__search-results is-hidden';
        this._result.innerHTML = html;
        this.content = this._result.querySelector('.item-finder__search-results-holder');
        document.body.appendChild(this._result);
        document.getElementById("closeResult").onclick = (e) => {
            this.close(e);
        }
    }
    close(e) {
        if (e) e.preventDefault();
        this._result.classList.add('is-hidden');
        this.blacker.hide();
    }

    open() {
        this.content.innerHTML = '';
        this._result.classList.remove('is-hidden');
    }
};