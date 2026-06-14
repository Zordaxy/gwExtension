import { Settings } from "js/settings";
import { RESOURCE_PAGE_CODES } from "js/settingsConfig";

// The object-edit page (objectedit.php) lists each resource in its own <tr>
// with a "price per unit" input named pricer[<code>], matched against the saved
// prices in Settings.resources (the editable subset of EDITABLE_DEFAULTS).
export const ObjectPrices = {
    // Only objectedit.php has the resource price inputs; bail elsewhere.
    init() {
        if (!window.location.pathname.includes("/objectedit.php")) {
            return;
        }

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

        const render = () => entries.forEach((entry) => this.mark(entry, render));

        this.addApplyAll(entries, render);
        render();
    },

    // Append the trailing cell on a resource row: a clickable red saved price
    // when it differs from the current input, or a green check when they match.
    mark({ input, row, stored }, render) {
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
};
