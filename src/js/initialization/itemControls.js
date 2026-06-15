import { Settings } from "js/settings";
import { BagSell } from "js/features/bagSell";
import { Eco } from "js/features/eco";

// On the items page (items.php), put "bag sell" and "eco" below the
// "Предметы с собой" title (in the same cell), side by side, each with a
// checkmark shown once it finishes.
export const ItemControls = {
    init() {
        // The innermost cell holding the title (skip the wrapper with a table).
        const title = [...document.querySelectorAll("td")].find(
            (td) =>
                td.textContent.includes("Предметы с собой") && !td.querySelector("table")
        );
        if (!title) {
            return;
        }

        const row = document.createElement("div"); // block → drops below the title
        row.style.whiteSpace = "nowrap";
        row.style.marginTop = "4px";

        if (Settings.showButtons.bag) {
            row.appendChild(this.control("bag sell", () => new BagSell().findBagList()));
        }
        if (Settings.showButtons.eco) {
            row.appendChild(this.control("eco", () => new Eco().ecoSale()));
        }

        if (row.children.length) {
            title.appendChild(row);
        }
    },

    control(label, action) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.className = "apply-all";

        const check = document.createElement("span");
        check.className = "green";
        check.textContent = " ✓";
        check.style.visibility = "hidden"; // reserve the space, no jump

        button.onclick = async () => {
            button.disabled = true;
            await action();
            check.style.visibility = "visible";
        };

        // inline-block so the two controls sit horizontally
        const wrap = document.createElement("span");
        wrap.style.display = "inline-block";
        wrap.style.marginRight = "6px";
        wrap.append(button, check);
        return wrap;
    },
};
