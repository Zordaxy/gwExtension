import { ajaxQuery } from './http';
import { HighTeck } from '../data/highTeck';

export const AutoPublic = {
    init() {
        if(!localStorage.getItem('apSellPrice')) {
            localStorage.setItem('apSellPrice', 62)
        }

        if(!localStorage.getItem('apBuyPrice')) {
            localStorage.setItem('apBuyPrice', 60)
        }


        this.schet = 0;
        this.apMode = typeof localStorage.apMode !== 'undefined' ? localStorage.apMode : '0'; //режим размещения
        this.apIsland = typeof localStorage.apIsland !== 'undefined' ? localStorage.apIsland : '0'; //остров размещения
        if (this.apIsland === '0') localStorage.apIsland = '0';
        this.apRentGun = HighTeck.list;
    },

    showAdvertisement() {
        var shadow = document.createElement('div');
        shadow.innerHTML = ' ';
        shadow.setAttribute('id', 'shadow');
        shadow.setAttribute('style', 'position:absolute;top:0px;left:0px;width:100%;height:115%;background:black;opacity:0.5;filter:alpha(opacity=50);-moz-opacity:0.5;');
        document.getElementsByTagName('body')[0].appendChild(shadow);
        var menu = document.createElement('div');
        menu.setAttribute('id', 'menu');
        menu.setAttribute('style', 'position:absolute;width:220px;height:160px;left:35%;top:35%;padding:10px;background:black;color:white;');
        menu.innerHTML = `
                        <p>
                            Укажите цены:
                        </p>
                        <table>
                            <tr>
                                <td style="color:#fff">Цена продажи за EUN:</td>
                                <td width=55><input onchange="localStorage.apSellPrice = this.value;" id="sellPrice" size="3" value="${this.apSellPrice}"></td>
                            </tr>
                            <tr>
                                <td style="color:#fff">Цена покупки за EUN:</td>
                                <td>
                                    <input type="text" id="buyPrice" onchange="localStorage.apBuyPrice = this.value;" size="3" value="${this.apBuyPrice}">
                                </td>
                            </tr>
                            <tr>
                                <td colspan="2" align="center">
                                    <p style="color:white;">
                                        <input onclick="localStorage.apIsland = -1" name="browser" type="radio" ${(this.apIsland == '-1' ? 'checked' : '')}>
                                        [Все] 
                                        <input onclick="localStorage.apIsland = 0" name="browser" type="radio" ${(this.apIsland == '0' ? 'checked' : '')}>
                                        [G] 
                                        <input onclick="localStorage.apIsland = 1" name="browser" type="radio" ${(this.apIsland == '1' ? 'checked' : '')}>
                                        [Z] 
                                        <input onclick="localStorage.apIsland = 4" name="browser" type="radio" ${(this.apIsland == '4' ? 'checked' : '')}>
                                        [P]
                                    </p>
                                    <input id="buyBtn" value="Куплю" type="submit"> 
                                    <input id="sellBtn" value="Продам" type="submit"> 
                                    <input id="allBtn" value="Все" type="submit">
                                </td>
                            </tr>
                        </table>`;
        document.getElementsByTagName('body')[0].appendChild(menu);
        document.getElementById('buyBtn').addEventListener('click', buyBtn, false);
        document.getElementById('sellBtn').addEventListener('click', sellBtn, false);
        document.getElementById('allBtn').addEventListener('click', allBtn, false);
    },

    buyBtn() {
        localStorage.apMode = '1';
        mainStart()
    },

    sellBtn() {
        localStorage.apMode = '2';
        mainStart()
    },

    allBtn() {
        localStorage.apMode = '0';
        mainStart()
    },

    mainStart() {
        try {
            document.getElementById('menu').innerHTML = '<center><p>Размещение объявлений:<p><p>Обработано: <span id="schet">' + schet + '</span> предметов. Текущий: <span id="namer">n/a</span></p><br><input onclick="window.location.reload()" type="submit" value="Стоп!"><center>';
        } catch (e) {
            ;
        }
        var lschet = 0;
        for (var apArt in apRentGun) {
            if (lschet === this.schet) {
                var name = apArt;
                if (/\_\_/.test(name)) name = name.replace('__', '');
                let url = "";
                switch (localStorage.apMode) {
                    case '0':
                        // продажа целого 50/50
                        url = 'http://www.ganjawars.ru/market-p.php?item_id=' + name + '&action_id=1&stage=3&island=' + localStorage.apIsland + '&price=' + String(Number(localStorage.apSellPrice) * Number(/(.*?)\:/.exec(apRentGun[apArt])[1]) * 1000) + '&modificator=0&durability1=' + apRentGun[apArt].substring(3, apRentGun[apArt].length) + '&durability2=' + apRentGun[apArt].substring(3, apRentGun[apArt].length) + '&date_len=3';
                        ajaxQuery(url, 'POST');

                        // купля ломаного 0/0
                        url = 'http://www.ganjawars.ru/market-p.php?item_id=' + name + '&action_id=2&stage=3&island=' + localStorage.apIsland + '&price=' + String(Number(localStorage.apBuyPrice) * Math.floor((Number(/(.*?)\:/.exec(apRentGun[apArt])[1]) * 0.9)) * 1000) + '&modificator=0&durability1=0&durability2=0&date_len=3';
                        break;
                    case '1':
                        url = 'http://www.ganjawars.ru/market-p.php?item_id=' + name + '&action_id=2&stage=3&island=' + localStorage.apIsland + '&price=' + String(Number(localStorage.apBuyPrice) * Math.floor((Number(/(.*?)\:/.exec(apRentGun[apArt])[1]) * 0.9)) * 1000) + '&modificator=0&durability1=0&durability2=0&date_len=3';
                        break;
                    case '2':
                        url = 'http://www.ganjawars.ru/market-p.php?item_id=' + name + '&action_id=1&stage=3&island=' + localStorage.apIsland + '&price=' + String(Number(localStorage.apSellPrice) * Number(/(.*?)\:/.exec(apRentGun[apArt])[1]) * 1000) + '&modificator=0&durability1=' + apRentGun[apArt].substring(3, apRentGun[apArt].length) + '&durability2=' + apRentGun[apArt].substring(3, apRentGun[apArt].length) + '&date_len=3';
                        break;
                }

                ajaxQuery(url, 'POST', '', () => {
                    if (name === 'saperka3') {
                        stop();
                    }
                });
                this.schet++;
                try {
                    document.getElementById('schet').innerHTML = this.schet;
                    document.getElementById('namer').innerHTML = name;
                } catch (e) {
                    ;
                }
                setTimeout(mainStart, 1000);
                break;
            }
            lschet++;
        }
    },

    stop() {
        document.getElementById('menu').innerHTML = '<center><p>Объявления успешно размещены!</p><br><br><br><input type="submit" value="Закрыть" id="close"></center>';
        document.getElementById('menu').setAttribute('id', 'lastmenu');
        document.getElementById('close').addEventListener('click', close, false);
    },

    close() {
        document.getElementById('lastmenu').parentNode.removeChild(document.getElementById('lastmenu'));
        document.getElementById('shadow').parentNode.removeChild(document.getElementById('shadow'));
    },
}