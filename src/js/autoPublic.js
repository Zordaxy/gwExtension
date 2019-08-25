import { Http } from './http';
import { HighTeck } from '../data/highTeck';
import { Settings } from './settings';
import { App } from './app';

export const AutoPublic = {
    count: 0,

    showAdvertisement() {
        App.blacker.show();

        let menu = document.createElement('div');
        menu.setAttribute('id', 'publicationMenu');
        menu.innerHTML = `
                        <p>
                            Set prices:
                        </p>
                        <table>
                            <tr>
                                <td style="color:#fff">Цена продажи за EUN:</td>
                                <td width=55><input onchange="localStorage.setItem('apSellPrice', this.value)" id="sellPrice" size="3" value="${localStorage.getItem('apSellPrice')}"></td>
                            </tr>
                            <tr>
                                <td style="color:#fff">Цена покупки за EUN:</td>
                                <td>
                                    <input type="text" id="buyPrice" onchange="localStorage.setItem('apBuyPrice', this.value)" size="3" value="${localStorage.getItem('apBuyPrice')}">
                                </td>
                            </tr>
                            <tr>
                                <td colspan="2" align="center">
                                    <p style="color:white;">
                                        <input onclick="localStorage.setItem('apIsland', -1)" name="browser" type="radio" ${(localStorage.getItem('apIsland') == '-1' ? 'checked' : '')}>
                                        [Все] 
                                        <input onclick="localStorage.setItem('apIsland', 0)" name="browser" type="radio" ${(localStorage.getItem('apIsland') == '0' ? 'checked' : '')}>
                                        [G] 
                                        <input onclick="localStorage.setItem('apIsland', 1)" name="browser" type="radio" ${(localStorage.getItem('apIsland') == '1' ? 'checked' : '')}>
                                        [Z] 
                                        <input onclick="localStorage.setItem('apIsland', 4)" name="browser" type="radio" ${(localStorage.getItem('apIsland') == '4' ? 'checked' : '')}>
                                        [P]
                                    </p>
                                    <input id="buyBtn" value="Bye" type="submit"> 
                                    <input id="sellBtn" value="Sell" type="submit"> 
                                    <input id="allBtn" value="All" type="submit">
                                </td>
                            </tr>
                        </table>`;
        document.getElementsByTagName('body')[0].appendChild(menu);
        document.getElementById('buyBtn').addEventListener('click', this.mainStart.bind(this, 1), false);
        document.getElementById('sellBtn').addEventListener('click', this.mainStart.bind(this, 2), false);
        document.getElementById('allBtn').addEventListener('click', this.mainStart.bind(this, 0), false);
    },

    mainStart(apMode) {
        apMode = apMode || 0;
        let menu = document.getElementById('publicationMenu');

        if (menu) {
            menu.innerHTML = `
                <center>
                    <p>Set advertisement:<p>
                    <p>Обработано: 
                        <span id="schet">${AutoPublic.count}</span> предметов. Текущий: 
                        <span id="namer">n/a</span>
                    </p>
                    <br>
                    <input onclick="window.location.reload()" type="submit" value="Стоп!">
                <center>`;
        }
        let lschet = 0;
        for (let apArt in HighTeck.list) {
            if (lschet === AutoPublic.count) {
                let name = apArt;
                if (/\_\_/.test(name)) name = name.replace('__', '');
                let url = "";
                switch (apMode) {
                    case 0:
                        // продажа целого 50/50
                        url = `${Settings.domain}/market-p.php?
                            item_id=${name}&action_id=1
                            &stage=3
                            &island=${localStorage.getItem('apIsland')}
                            &price=${String(+(localStorage.getItem('apSellPrice')) * Number(/(.*?)\:/.exec(HighTeck.list[apArt])[1]) * 1000)}
                            &modificator=0
                            &durability1=${ HighTeck.list[apArt].substring(3, HighTeck.list[apArt].length)}
                            &durability2=${HighTeck.list[apArt].substring(3, HighTeck.list[apArt].length)}
                            &date_len=3`;
                        Http.post(url);

                        // купля ломаного 0/0
                        url = `${Settings.domain}/market-p.php?
                            item_id=${name}
                            &action_id=2
                            &stage=3
                            &island=${localStorage.getItem('apIsland')}
                            &price=${String(+(localStorage.getItem('apBuyPrice')) * Math.floor((Number(/(.*?)\:/.exec(HighTeck.list[apArt])[1]) * 0.9)) * 1000)}
                            &modificator=0
                            &durability1=0
                            &durability2=0
                            &date_len=3`;
                        break;
                    case 1:
                        url = `${Settings.domain}/market-p.php?
                            item_id=${name}
                            &action_id=2
                            &stage=3
                            &island=${localStorage.getItem('apIsland')}
                            &price=${String(+(localStorage.getItem('apBuyPrice')) * Math.floor((Number(/(.*?)\:/.exec(HighTeck.list[apArt])[1]) * 0.9)) * 1000)}
                            &modificator=0
                            &durability1=0
                            &durability2=0
                            &date_len=3`;
                        break;
                    case 2:
                        url = `${Settings.domain}/market-p.php?
                            item_id=${name}
                            &action_id=1
                            &stage=3
                            &island=${localStorage.getItem('apIsland')}
                            &price=${String(+(localStorage.getItem('apSellPrice')) * Number(/(.*?)\:/.exec(HighTeck.list[apArt])[1]) * 1000)}
                            &modificator=0
                            &durability1=${HighTeck.list[apArt].substring(3, HighTeck.list[apArt].length)}'
                            &durability2=${HighTeck.list[apArt].substring(3, HighTeck.list[apArt].length)}
                            &date_len=3`;
                        break;
                }

                Http.post(url).subscribe(() => {
                    if (name === 'saperka3') {
                        stop();
                    }
                });

                AutoPublic.count++;
                if (document.getElementById('schet')) {
                    document.getElementById('schet').innerHTML = AutoPublic.count;
                }
                if (document.getElementById('namer')) {
                    document.getElementById('namer').innerHTML = name;
                }
                setTimeout(this.mainStart.bind(this, apMode), 1000);
                break;
            }
            lschet++;
        }
    },

    stop() {
        document.getElementById('publicationMenu').innerHTML = `
            <center>
                <p>Объявления успешно размещены!</p>
                <br><br><br>
                <input type="submit" value="Закрыть" id="close">
            </center>`;
        document.getElementById('publicationMenu').setAttribute('id', 'lastmenu');
        document.getElementById('close').addEventListener('click', close, false);
    },

    close() {
        document.getElementById('lastmenu').parentNode.removeChild(document.getElementById('lastmenu'));
        App.blacker.hide();
    },
}