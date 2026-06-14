import { Settings } from "js/settings";
import { RESOURCE_PAGE_CODES } from "js/settingsConfig";
import { Ordinal } from "data/ordinal";
import { Storage } from "js/storage";

// Decorates the object-edit page (objectedit.php):
//  - each resource row gets a saved-price cell (click to apply), plus an
//    "apply all" button on the header row;
//  - the money form is pre-filled so submitting leaves the object at the
//    optimal production balance.
export const ObjectEdit = {
    init() {
        const path = window.location.pathname;

        if (path.includes("/objectedit.php")) {
            this.markPrices();
            this.balanceMoney();
        }

        // Learn shopTypes whenever a property is opened — on the view page
        // (object.php) or the edit page (objectedit.php). Kept separate from the
        // decorations above so a failure there can't block the recording.
        if (path.includes("/object.php") || path.includes("/objectedit.php")) {
            this.recordShopTypes();
        }
    },

    // --- Shop types --------------------------------------------------------

    // Derive which shopTypes this property deals in (from the items it lists)
    // and cache propertyId -> shopTypes so the realty page can sub-sort by type.
    // shopTypes can change, so re-derive and overwrite whenever the page opens.
    recordShopTypes() {
        const propertyId = new URLSearchParams(window.location.search).get("id");
        if (!propertyId) {
            return;
        }

        const ids = new Set();
        // price[r|p|m][<itemId>] inputs name the items the property buys/sells.
        document.querySelectorAll('input[name^="price"]').forEach((input) => {
            const match = input.name.match(/\[(.+)\]/);
            if (match) {
                ids.add(match[1]);
            }
        });
        // statlist.php?r=<itemId> / ...&lockr=<itemId> references.
        document
            .querySelectorAll('a[href*="statlist.php?r="], a[href*="lockr="]')
            .forEach((link) => {
                const match = link.href.match(/(?:[?&]r=|lockr=)([^&]+)/);
                if (match) {
                    ids.add(decodeURIComponent(match[1]));
                }
            });

        const shopTypes = [
            ...new Set([...ids].map((id) => Ordinal.get(id)?.shopType).filter(Boolean)),
        ].sort();

        console.log(`GW Checker: property ${propertyId} shopTypes`, shopTypes);

        // Only write when it actually changed.
        const stored = Storage.getPropertyTypes()[propertyId];
        if (JSON.stringify(stored) !== JSON.stringify(shopTypes)) {
            Storage.setPropertyTypes(propertyId, shopTypes);
        }
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
                    pageKey,
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

        // Uran row gets an extra "x" that fills its "Максимум" (pricem[uran]).
        const uran = entries.find((entry) => entry.pageKey === "uran");
        if (uran) {
            this.addUranMax(uran.row);
        }
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

        // Keep the saved-price cell before the uran "x" button if it exists.
        const uranMax = row.querySelector(".uran-max");
        if (uranMax) {
            row.insertBefore(cell, uranMax);
        } else {
            row.appendChild(cell);
        }
    },

    // "x" on the uran row that fills its "Максимум" (pricem[uran]) with the
    // amount needed to cover the uran the product will consume. See setUranMax.
    addUranMax(row) {
        const cell = document.createElement("td");
        cell.textContent = "stop";
        cell.className = "money-reset uran-max";
        cell.title = "Fill the uran maximum";
        cell.onclick = () => this.setUranMax(row);
        row.appendChild(cell);
    },

    setUranMax(row) {
        const table = row.closest("table");
        const pricem = row.querySelector('input[name^="pricem["]');
        if (!pricem) {
            return;
        }

        // a — the cell right after the pricem input (Ед/ч for this resource).
        const a = Number(pricem.closest("td").nextElementSibling?.textContent);
        // c — this row's "Наличие" (current uran stock).
        const c = Number(row.cells[1]?.textContent);
        // b — fractional part of the first resource row's "Наличие" (the produced
        // item's stock), e.g. 4.32 -> 0.32.
        const header = [...table.rows].find((r) => r.textContent.includes("Наличие"));
        const stock = Number(header?.nextElementSibling?.cells[1]?.textContent);

        if (![a, stock, c].every(Number.isFinite)) {
            return;
        }

        const b = stock % 1;
        let sum = (1 - b) * a + 2;
        while (sum < c) {
            sum += a;
        }
        pricem.value = Math.floor(sum);
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
