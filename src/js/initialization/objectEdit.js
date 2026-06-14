import { Settings } from "js/settings";
import { RESOURCE_PAGE_CODES } from "js/settingsConfig";

// Decorates the object-edit page (objectedit.php):
//  - each resource row gets a saved-price cell (click to apply), plus an
//    "apply all" button on the header row;
//  - the money form is pre-filled so submitting leaves the object at the
//    optimal production balance.
export const ObjectEdit = {
    init() {
        if (!window.location.pathname.includes("/objectedit.php")) {
            return;
        }

        this.markPrices();
        this.balanceMoney();
    },

    // --- Resource prices ---------------------------------------------------

    markPrices() {
        // Each resource row holds a "price per unit" input named pricer[<code>],
        // matched against the saved prices in Settings.resources.
        const entries = [...document.querySelectorAll('input[name^="pricer["]')]
            .map((input) => {
                const pageKey = input.name.slice("pricer[".length, -1); // pricer[metal] -> metal
                const settingsKey = RESOURCE_PAGE_CODES[pageKey] || pageKey;
                return {
                    input,
                    row: input.closest("tr"),
                    stored: Settings.resources[settingsKey],
                };
            })
            // Keep only resources we have a saved price for.
            .filter(({ row, stored }) => row && stored !== undefined);

        if (!entries.length) {
            return;
        }

        const render = () => entries.forEach((entry) => this.markRow(entry, render));

        this.addApplyAll(entries, render);
        render();
    },

    // Append the trailing cell on a resource row: a clickable red saved price
    // when it differs from the current input, or a green check when they match.
    markRow({ input, row, stored }, render) {
        row.querySelector(".saved-price")?.remove();

        const cell = document.createElement("td");

        if (Number(input.value) === Number(stored)) {
            cell.className = "saved-price saved-price--ok";
            cell.textContent = "✓";
            cell.title = "Matches your saved price";
        } else {
            cell.className = "saved-price";
            cell.textContent = stored;
            cell.title = "Click to apply your saved price";
            cell.onclick = () => {
                input.value = stored;
                render();
            };
        }

        row.appendChild(cell);
    },

    // Put an "apply all" button on the header row above the resource rows
    // (the one labelling the "Цена за единицу" column) so it lines up with the
    // per-row cells. Applying writes every saved price, then re-renders to checks.
    addApplyAll(entries, render) {
        const table = entries[0].row.closest("table");
        const header = [...table.rows].find((row) =>
            row.textContent.includes("Цена за единицу")
        );
        if (!header) {
            return;
        }

        const button = document.createElement("button");
        button.type = "button"; // inside a <form> — must not submit it
        button.textContent = "apply all";
        button.className = "apply-all";
        button.onclick = () => {
            entries.forEach(({ input, stored }) => {
                input.value = stored;
            });
            render();
        };

        const cell = document.createElement("td");
        cell.appendChild(button);
        header.appendChild(cell);
    },

    // --- Money balance -----------------------------------------------------

    // The money form ("Управление счетом") shows the object's current balance
    // after "на объекте" inside a <b>. Pre-fill money_in / money_out so
    // submitting the form leaves the object at the optimal production balance.
    balanceMoney() {
        const moneyIn = document.querySelector('[name="money_in"]');
        const moneyOut = document.querySelector('[name="money_out"]');
        if (!moneyIn || !moneyOut) {
            return;
        }

        // "на объекте <b>$500,057</b>" sits in the money_out row.
        const balanceNode = moneyOut.closest("tr")?.querySelector("b");
        if (!balanceNode) {
            return;
        }

        const balance = Number(balanceNode.textContent.replace(/[^0-9]/g, ""));
        const target = Settings.productionBalance;

        // Quick "x" shortcut: withdraw all but 10 so the object keeps a balance of 10.
        const reset = document.createElement("td");
        reset.textContent = "x";
        reset.className = "money-reset";
        reset.title = "Withdraw all but 10";
        reset.onclick = () => {
            moneyOut.value = balance - 10;
        };
        moneyOut.closest("tr").appendChild(reset);

        if (balance > target) {
            // Withdraw the excess so the object keeps exactly the target balance.
            moneyOut.value = balance - target;
        } else if (balance < target) {
            // Top up the difference to reach the target balance.
            moneyIn.value = target - balance;
        }
    },
};
