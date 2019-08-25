export class Result {
    constructor(blacker) {
        this.blacker = blacker;
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
    }
    close(e) {
        if (e) e.preventDefault();
        this._result.style.display = 'none';
        this.blacker.hide();
    }

    open() {
        this.content.innerHTML = '';
        this._result.style.display = 'block';
    }
};