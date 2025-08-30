export const ActionButtons = {
  init() {
    //this.navigation();
    //this.highlightPokemons();
    this.pickItemsOnOut();
  },

  navigation() {
    document.onkeydown = (evt) => {
      evt = evt || window.event;
      if (
        evt.keyCode === 100 ||
        (evt.keyCode === 32 &&
          (typeof chatactive === "undefined" || chatactive === 0))
      ) {
        let turn = document.querySelector("form[name=battleform] a");
        let update = document.querySelector(
          "a[href='javascript:void(updatedata())']"
        );
        let fontName = document.querySelector("font[color=F7941D]");
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
    };
  },

  highlightPokemons() {
    const selection = document.querySelectorAll(".floatdiv");
    const re = new RegExp("^.*(.), (1..)*%$");

    if (selection) {
      selection.forEach((x) => {
        const text = x.innerText;
        if (re.test(text) && re.exec(text) && Number(re.exec(text)[1]) > 1) {
          x.style.backgroundColor = "green";
        }
      });
    }
  },

  pickItemsOnOut() {
    const listToPick = [
      "Медицинский бинт",
      "Фляга с водой",
      "Книга опыта",
      "Энергетик",
      "Походная аптечка",
      //   "Стимпак урона XL",
      //   "Стимпак брони XL",
      "Стимпак урона",
      "Стимпак брони",
      "Стимпак скорости",
      "Вяленая рыба",
      "Гриб",
      "Динамит",
      "Кокос",
    ];

    console.log(window.location.href);
    if (
      window.location.href === "https://www.gwars.io/walk.op.php" ||
      window.location.href === "https://www.gwars.io/walk.op.php?welcome" ||
      window.location.href === "https://www.gwars.io/walk.bp.php" ||
      window.location.href === "https://www.gwars.io/walk.bp.php?welcome"
    ) {
      console.log("setInterval");

      let isPicked = false;
      console.log("interval started");
      setInterval(() => {
        const takeButton = document.querySelector("#takebutt");
        const takeSection = document.querySelector("#gotakeit");

        if (isPicked) {
          isPicked = !!takeButton;
          return;
        } else if (!!takeButton) {
          console.log("button found");

          const needPickUp = listToPick.some((word) =>
            takeSection?.innerText.includes(word)
          );

          if (needPickUp) {
            isPicked = true;
            takeButton.click();
          }
        }
      }, 300);
    }
  },
};
