export const ActionButtons = {
  init() {
    //this.navigation();
    //this.highlightPokemons();
    this.pickItemsOnOut();
    this.addQuestSetLink();
    //this.sortUran();
  },

  addQuestSetLink() {
    if (!["/ops.php", "/questlog.php"].includes(window.location.pathname)) return;

    const heading = Array.from(document.querySelectorAll(".opclisthead h2"))
      .find((element) => element.textContent.trim() === "Доступные операции");
    if (!heading || document.getElementById("gw-wear-quest-set")) return;

    const checks = new Map();
    let previous = heading;
    for (const [setId, name, id, checkClass] of [
      ["7", "quest set", "gw-wear-quest-set", "quest-set-check"],
      ["2", "main set", "gw-wear-main-set", "main-set-check"],
    ]) {
      const link = document.createElement("a");
      link.id = id;
      link.href = `/home.do.php?putset=${setId}`;
      link.target = "_blank";
      link.textContent = name;
      link.className = "green";
      link.style.cssText = "text-decoration:none;font-weight:bold;color:#009900;";
      const check = document.createElement("span");
      check.className = `green ${checkClass}`;
      check.textContent = "✓ ";
      check.title = `${name} action completed`;
      check.style.visibility = "hidden";
      if (previous !== heading) check.style.marginLeft = "8px";
      previous.after(check, link);
      checks.set(setId, check);
      previous = link;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        check.style.visibility = "hidden";
        window.open(link.href, "_blank");
      });
    }
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== "equipment-set-completed") return;
      const check = checks.get(message.setId);
      if (!check) return;
      check.style.visibility = "visible";
      sendResponse({ ok: true });
    });
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
          x.classList.add("is-active");
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

  sortUran() {
    const nobr = Array.from(document.querySelectorAll("nobr")).find((tr) =>
      tr.textContent.toLowerCase().includes("продать")
    );
    const table = nobr.parentNode;
    const tbody = table.children[2].querySelector("tbody");
    let dataRows = Array.from(tbody.children).filter(
      (el) => el.tagName === "TR"
    );
    let bold = [];
    let normal = [];

    isBoldRow = (tr) =>
      tr.querySelector('a[style*="font-weight:bold"]') !== null;
    for (const tr of dataRows) {
      (isBoldRow(tr) ? bold : normal).push(tr);
    }

    tbody.append(...bold, ...normal);
  },
};

// const makeColorOutland = () => {
//   document.querySelectorAll('.floatdiv').forEach(colorPokemon);

//   if (window.gotourl) {
//       window.gotourl = function(obj) {
//           const url = obj.href + '&nohead=1';
//           const lastUrl = url;

//           $('body').load(url, function(_responseTxt, statusTxt, _xhr) {
//               if (statusTxt === 'success') makeColorOutland();
//               else window.location.href = lastUrl;
//           });
//           return false;
//       };
//   }
// };
