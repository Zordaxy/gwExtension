export const ActionButtons = {
    init() {
        document.onkeydown = evt => {
            evt = evt || window.event;
            if ((evt.keyCode === 100) || ((evt.keyCode === 32) && (typeof chatactive === 'undefined' || chatactive === 0))) {
                let turn = document.querySelector("form[name=battleform] a");
                let update = document.querySelector("a[href='javascript:void(updatedata())']");
                let fontName = document.querySelector('font[color=F7941D]');
                let map = document.querySelector('a[href="/map.php"]');

                if (turn) {
                    turn.click();
                }
                if (update) {
                    update.click();
                }
                if (fontName && map) {
                    map.click();
                }
            }
        }
    },

    highlightPokemons() {
        const selection = document.querySelectorAll('.floatdiv');
        const re = new RegExp("^.*(.), (1..)*%$");

        if (selection) {
            selection.forEach(x => {
                const text = x.innerText;
                if (re.test(text)
                    && re.exec(text)
                    && Number(re.exec(text)[1]) > 1
                ) {
                    x.style.backgroundColor = 'green';
                }
            });
        }
    }
}