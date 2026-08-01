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
        link.onclick = (event) => {
            event.preventDefault();
            this.#openAll(rows);
        };
        cell.appendChild(link);

        const tr = document.createElement('tr');
        tr.className = 'realty-generated-row';
        tr.appendChild(cell);
        return tr;
    }

    // Open every given property's page in a new tab.
    #openAll(rows) {
        rows.forEach((row) => {
            const id = this.#objectId(row);
            if (id) {
                window.open(`/object.php?id=${id}`, '_blank');
            }
        });
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
        button.onclick = () => this.#openAll(sectorRows);

        cell.append(label, ' ', button);

        const tr = document.createElement('tr');
        tr.className = 'realty-generated-row';
        tr.appendChild(cell);
        return tr;
    }
}
