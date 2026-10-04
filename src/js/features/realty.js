import { Storage } from "js/storage";
import { Http } from "js/http";
import { Menu } from "js/widgets/menu";
import { PROPERTY_SKIP_PREFIXES, PropertyInfo } from "js/propertyInfo";

// Realty list (info.realty.php): set aside the properties we don't manage here,
// regroup the rest by sector (header + "show all"), and sub-sort each sector by
// the shopTypes learned when its managed properties were opened.
export class Realty {
    // Property types to hide — matched against the object link text.
    static SKIP_PREFIXES = PROPERTY_SKIP_PREFIXES;

    static addMoneyTotal() {
        if (location.pathname !== '/info.realty.php') return;
        const table = [...document.querySelectorAll('table.withborders')].find((candidate) =>
            [...(candidate.tBodies[0]?.rows[0]?.cells || [])].some((cell) => /^Сч[её]т$/i.test(cell.textContent.trim())));
        if (!table) return;
        const header = table.tBodies[0].rows[0];
        const moneyIndex = [...header.cells].findIndex((cell) => /^Сч[её]т$/i.test(cell.textContent.trim()));
        const balances = [...table.tBodies].flatMap((body) => [...body.rows])
            .filter((row) => row.cells[0]?.querySelector('a[href*="object.php?id="]'))
            .map((row) => row.cells[moneyIndex]?.textContent || '');
        const total = balances.reduce((sum, balance) => {
                const text = balance.replace(/Гб|[$,\s]/gi, '');
                const amount = text ? Number(text) : NaN;
                return sum + (Number.isFinite(amount) ? amount : 0);
            }, 0);
        table.querySelector('[data-test-realty-money-total]')?.remove();
        const row = table.createTFoot().insertRow();
        row.setAttribute('data-test-realty-money-total', '');
        row.style.fontWeight = 'bold';
        if (moneyIndex > 0) {
            const label = row.insertCell();
            label.className = 'greenbg';
            label.colSpan = moneyIndex;
            label.textContent = 'Итого';
        }
        const amount = row.insertCell();
        amount.className = 'greenbg';
        amount.align = 'right';
        const formatted = total.toLocaleString('en-US');
        amount.textContent = balances.some((balance) => /Гб/i.test(balance)) ? `${formatted} гб` : `$${formatted}`;
        const remaining = header.cells.length - moneyIndex - 1;
        if (remaining > 0) {
            const spacer = row.insertCell();
            spacer.className = 'greenbg';
            spacer.colSpan = remaining;
        }
    }

    sortProperties() {
        const table = document.querySelector('table.withborders');
        if (!table) {
            return;
        }

        const body = table.tBodies[0];
        body.querySelectorAll('.realty-generated-row').forEach((row) => row.remove());

        const header = body.rows[0];
        const rows = [...body.rows].slice(1).filter((row) => this.#objectId(row));
        const colSpan = header.cells.length;
        this.types = Storage.getPropertyTypes(); // propertyId -> shopTypes[]

        // Group the manageable properties by sector (Район); everything else
        // (banks, houses, shops, ...) is kept aside to show unsorted at the end.
        const groups = new Map();
        const others = [];
        rows.forEach((row) => {
            const type = this.#typeName(row);
            if (!type) {
                return;
            }
            if (Realty.SKIP_PREFIXES.some((prefix) => type.startsWith(prefix))) {
                others.push(row);
                return;
            }
            const sector = this.#sectorName(row);
            if (!groups.has(sector)) {
                groups.set(sector, []);
            }
            groups.get(sector).push(row);
        });

        // Rebuild: each sector gets a header row, then its properties sub-sorted
        // by shopType (unknown ones in a trailing "unsorted" section)...
        groups.forEach((sectorRows, sector) => {
            body.appendChild(this.#groupHeader(sector, sectorRows, colSpan));
            this.#appendBySubType(body, sectorRows, colSpan);
        });

        // ...then the remaining properties, in their original order, at the end.
        others.forEach((row) => body.appendChild(row));

        this.#addRefreshButton();
    }

    #addRefreshButton() {
        if (document.querySelector('.refresh-properties')) {
            return;
        }

        const menu = new Menu('refresh properties', () => this.#refreshProperties());
        menu.element?.classList.add('refresh-properties');
    }

    async #refreshProperties() {
        const button = document.querySelector('.refresh-properties');
        document.querySelector('.refresh-properties-check')?.remove();
        const properties = [
            ...new Map(
                [...document.querySelectorAll('table.withborders tr')]
                    .filter((row) => {
                        const type = this.#typeName(row);
                        return (
                            type &&
                            !Realty.SKIP_PREFIXES.some((prefix) =>
                                type.startsWith(prefix)
                            )
                        );
                    })
                    .map((row) => {
                        const link = row.cells[0]?.querySelector(
                            'a[href*="object.php?id="]'
                        );
                        const id = this.#objectId(row);
                        return id && link ? [id, link.href] : null;
                    })
                    .filter(Boolean)
            ).entries(),
        ];

        Storage.clearPropertyInfo();
        if (button) {
            button.textContent = `refreshing 0/${properties.length}`;
            button.style.pointerEvents = 'none';
        }

        try {
            let completed = 0;
            await Http.processWithDelay(
                properties,
                async ([propertyId, url]) => {
                    const doc = await Http.fetchGet(url);
                    PropertyInfo.record(doc, propertyId);
                    completed += 1;
                    if (button) {
                        button.textContent = `refreshing ${completed}/${properties.length}`;
                    }
                },
                200
            );
            this.sortProperties();

            const check = document.createElement('span');
            check.className = 'green refresh-properties-check';
            check.textContent = ' ✓';
            button?.after(check);
        } finally {
            if (button) {
                button.textContent = 'refresh properties';
                button.style.pointerEvents = '';
            }
        }
    }

    // Within one sector, group rows by their stored shopTypes (sorted), and keep
    // properties with no known type in a separate "unsorted" sub-section.
    #appendBySubType(body, sectorRows, colSpan) {
        const byType = new Map();
        const unknown = [];

        sectorRows.forEach((row) => {
            const types = this.types[this.#objectId(row)];
            if (types && types.length) {
                const key = [...types].sort().join(', ');
                if (!byType.has(key)) {
                    byType.set(key, []);
                }
                byType.get(key).push(row);
            } else {
                unknown.push(row);
            }
        });

        [...byType.keys()].sort().forEach((key) => {
            const typeRows = byType.get(key);
            body.appendChild(this.#subHeader(key, typeRows, colSpan));
            typeRows.forEach((row) => body.appendChild(row));
        });

        if (unknown.length) {
            body.appendChild(this.#subHeader('unsorted', unknown, colSpan));
            unknown.forEach((row) => body.appendChild(row));
        }
    }

    #subHeader(text, rows, colSpan) {
        const cell = document.createElement('td');
        cell.className = 'realty-subgroup';
        cell.colSpan = colSpan;
        cell.textContent = text;

        // "show all" as a link to the right of the sub-category name.
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = 'show all';
        link.className = 'realty-show-all-link';
        link.setAttribute('data-test-realty-show-all-link', '');
        cell.appendChild(this.#bindOpenAll(link, rows));

        const tr = document.createElement('tr');
        tr.className = 'realty-generated-row';
        tr.appendChild(cell);
        return tr;
    }

    #bindOpenAll(control, rows) {
        const wrapper = document.createElement('span');
        wrapper.className = control.tagName === 'A'
            ? 'realty-open-controls realty-open-controls--link'
            : 'realty-open-controls';
        const check = document.createElement('span');
        check.className = 'green realty-show-all-check';
        check.textContent = '✓ ';
        check.title = 'All properties opened';
        check.style.visibility = 'hidden';
        wrapper.append(check, control);
        let opening = false;
        const open = async (event) => {
            event.preventDefault();
            if (opening) {
                return;
            }
            opening = true;
            check.style.visibility = 'hidden';
            try {
                if (await this.#openAll(rows)) {
                    check.style.visibility = 'visible';
                }
            } catch (error) {
                console.error('Could not complete opening properties', error);
            } finally {
                opening = false;
            }
        };
        control.onclick = open;
        control.oncontextmenu = open;
        return wrapper;
    }

    // Return to the property list after each opening, then wait before the next.
    async #openAll(rows) {
        const ids = rows.map((row) => this.#objectId(row)).filter(Boolean);
        await Http.processWithDelay(ids, async (id) => {
            window.open(`/object.php?id=${id}`, '_blank');
            const result = await chrome.runtime.sendMessage({ type: 'reactivate-realty-tab' });
            if (result?.ok !== true) {
                throw new Error('Could not reactivate the property list');
            }
        }, 300);
        return true;
    }

    #typeName(row) {
        return row.cells[0]?.querySelector('a[href*="object.php"]')?.textContent.trim();
    }

    #sectorName(row) {
        return row.cells[1]?.textContent.trim() || 'Без сектора';
    }

    #objectId(row) {
        const href = row.cells[0]?.querySelector('a[href*="object.php"]')?.href;
        return href?.match(/id=(\d+)/)?.[1];
    }

    #groupHeader(sector, sectorRows, colSpan) {
        const cell = document.createElement('td');
        cell.className = 'realty-group';
        cell.colSpan = colSpan;

        const label = document.createElement('b');
        label.textContent = sector;

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'show all';
        button.className = 'apply-all realty-show-all';
        button.setAttribute('data-test-realty-show-all', '');
        cell.append(label, ' ', this.#bindOpenAll(button, sectorRows));

        const tr = document.createElement('tr');
        tr.className = 'realty-generated-row';
        tr.appendChild(cell);
        return tr;
    }
}
