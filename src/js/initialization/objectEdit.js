import { Settings } from "js/settings";
import { RESOURCE_PAGE_CODES } from "js/settingsConfig";
import { Ordinal } from "data/ordinal";
import { Storage } from "js/storage";
import { Realty } from "js/features/realty";

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
            this.recordShopSave();
        }

        // Learn shopTypes whenever a property is opened — on the view page
        // (object.php) or the edit page (objectedit.php). Kept separate from the
        // decorations above so a failure there can't block the recording.
        if (path.includes("/object.php") || path.includes("/objectedit.php")) {
            this.recordShopTypes();
        }

        if (path.includes("/object.php")) {
            this.addRememberMissing();
            this.addRefillButton();
        }

        // Shop save cooldowns are shown everywhere (the nav bookmarks bar links
        // to each shop), so the timers persist across pages and refreshes.
        this.showShopTimers();
    },

    // --- Shop restock --------------------------------------------------------

    // On a shop page, "remember" parses the "Приобретаемые ресурсы" table and
    // stores { resourceId: missingCount } (full - available) so a storage house
    // can be drained to refill it. Overrides any previously remembered shop.
    addRememberMissing() {
        // The actual header cell: starts with the title and has no nested table
        // (so we skip the outer wrappers whose text also contains the title).
        const header = [...document.querySelectorAll("td")].find(
            (td) =>
                td.textContent.trim().startsWith("Приобретаемые ресурсы") &&
                !td.querySelector("table")
        );
        const table = header?.closest("table");
        if (!table) {
            return;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "remember";
        button.className = "apply-all";

        // Checkmark shown once "remember" has been clicked.
        const done = document.createElement("span");
        done.className = "green";
        done.textContent = " ✓";
        done.style.display = "none";

        button.onclick = () => {
            this.rememberMissing(table);
            done.style.display = "";
        };

        // A full-width row on top of the table, so the button lines up with the
        // table's right edge (checkmark to its left).
        const cell = document.createElement("td");
        cell.colSpan = table.rows[0]?.cells.length || 1;
        cell.style.textAlign = "right";
        cell.append(done, button);

        const row = document.createElement("tr");
        row.appendChild(cell);
        table.tBodies[0].prepend(row);
    },

    rememberMissing(table) {
        const missing = {};

        [...table.rows].forEach((row) => {
            const link = row.cells[0]?.querySelector('a[href*="statlist.php?r="]');
            const id = link?.href.match(/[?&]r=([^&]+)/)?.[1];
            // "Наличие, ед." is "available/full"; missing = full - available.
            const [available, full] = (row.cells[1]?.textContent || "")
                .split("/")
                .map((part) => Number(part.trim()));

            if (!id || !Number.isFinite(available) || !Number.isFinite(full)) {
                return;
            }
            const count = full - available;
            if (count > 0) {
                missing[decodeURIComponent(id)] = count;
            }
        });

        Storage.setMissing(missing);
    },

    // On a storage house, a green "+" by the "Забрать" header fills each row's
    // am_out input with the remembered missing count for that resource.
    addRefillButton() {
        const header = [...document.querySelectorAll("td")].find(
            (td) => td.textContent.trim() === "Забрать"
        );
        if (!header) {
            return;
        }

        const button = document.createElement("span");
        button.textContent = "+";
        button.className = "refill-all";
        button.title = "Fill withdrawals with the remembered missing counts";
        button.onclick = () => this.refillMissing();

        header.appendChild(button);
    },

    refillMissing() {
        const missing = Storage.getMissing();
        document.querySelectorAll('input[name="am_out"]').forEach((amOut) => {
            const row = amOut.closest("tr");
            const id = row?.querySelector('input[name="resource"]')?.value;
            if (!id || missing[id] == null) {
                return;
            }

            // Subtract what you already have ("У вас", the 3rd cell) from the
            // stored missing count; leave the field alone when nothing's needed.
            const youHave = Number(row.cells[2]?.textContent.trim()) || 0;
            const result = missing[id] - youHave;
            if (result > 0) {
                amOut.value = result;
            }
        });
    },

    // --- Shop save cooldown --------------------------------------------------

    // A shop can save its prices once every 4 hours. Record the save time on
    // click and, next to the shop's object link, show a red "Xh Ym" countdown,
    // or a green check when the 4h have passed (or nothing was ever saved).
    // The object id — from the URL, or the hidden form field (the URL loses
    // ?id after the settings form POSTs it as a hidden field).
    propertyId() {
        return (
            new URLSearchParams(window.location.search).get("id") ||
            document.querySelector('input[name="id"]')?.value ||
            null
        );
    },

    // On a shop's edit page, store the save time when settings are saved.
    recordShopSave() {
        const saveButton = document.querySelector(
            'input[type="submit"][value="Сохранить настройки магазина"]'
        );
        const propertyId = this.propertyId();
        if (!saveButton || !propertyId) {
            return;
        }
        saveButton.addEventListener("click", () => {
            Storage.setShopSaveTime(propertyId, Date.now());
        });
    },

    // On every page, show each shop's save cooldown next to its object link
    // (e.g. the nav bookmarks): a red "hh:mm" countdown, or a green check once
    // the 4h have passed. Only shops with a stored save time get a marker.
    showShopTimers() {
        const times = Storage.getShopSaveTimes();
        const fourHours = 4 * 60 * 60 * 1000;

        document.querySelectorAll('a[href*="object.php?id="]').forEach((link) => {
            const id = link.href.match(/id=(\d+)/)?.[1];
            if (!id || times[id] === undefined) {
                return;
            }

            const remaining = times[id] + fourHours - Date.now();
            const indicator = document.createElement("span");
            if (remaining > 0) {
                const hours = Math.floor(remaining / (60 * 60 * 1000));
                const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                const pad = (n) => String(n).padStart(2, "0");
                indicator.className = "shop-timer";
                indicator.textContent = ` ${pad(hours)}:${pad(minutes)}`;
            } else {
                indicator.className = "green";
                indicator.textContent = " ✓";
            }
            link.after(indicator);
        });
    },

    // --- Shop types --------------------------------------------------------

    // Derive which shopTypes this property deals in (from the items it lists)
    // and cache propertyId -> shopTypes so the realty page can sub-sort by type.
    // shopTypes can change, so re-derive and overwrite whenever the page opens.
    recordShopTypes() {
        const propertyId = this.propertyId();
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

        // Only write when it actually changed.
        const stored = Storage.getPropertyTypes()[propertyId];
        if (JSON.stringify(stored) !== JSON.stringify(shopTypes)) {
            Storage.setPropertyTypes(propertyId, shopTypes);
        }

        // Record which item(s) this property develops — but never for the
        // skipped types (shops, banks, houses, syndicate bases), which sell
        // rather than develop. Clear any stale entry left for those.
        const name = this.propertyName();
        if (name && Realty.SKIP_PREFIXES.some((prefix) => name.startsWith(prefix))) {
            Storage.removePropertyResources(propertyId);
        } else {
            const produced = this.collectProducedItems();
            const storedProduced = Storage.getPropertyResources()[propertyId];
            if (JSON.stringify(storedProduced) !== JSON.stringify(produced)) {
                Storage.setPropertyResources(propertyId, produced);
            }
        }
    },

    // Property name from the page title: "... (NAME) ..." on objectedit,
    // "NAME в SECTOR ..." on object.php.
    propertyName() {
        const title = document.title || "";
        const parens = title.match(/\(([^)]+)\)/);
        return (parens ? parens[1] : title.split(" в ")[0]).trim();
    },

    // The item(s) a property develops: the pricep[<id>] input on the edit page,
    // or the links under the "Производимые ресурсы" table on the view page.
    collectProducedItems() {
        const ids = new Set();

        document.querySelectorAll('input[name^="pricep["]').forEach((input) => {
            const match = input.name.match(/\[(.+)\]/);
            if (match) {
                ids.add(match[1]);
            }
        });

        const header = [...document.querySelectorAll("td")].find(
            (td) => td.textContent.trim() === "Производимые ресурсы"
        );
        header
            ?.closest("table")
            ?.querySelectorAll('a[href*="statlist.php?r="]')
            .forEach((link) => {
                const match = link.href.match(/[?&]r=([^&]+)/);
                if (match) {
                    ids.add(decodeURIComponent(match[1]));
                }
            });

        return [...ids];
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
