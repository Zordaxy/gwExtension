// Realty list (info.realty.php): drop the properties we don't manage here,
// then regroup the rest by sector with a header + "show all" per sector.
export class Realty {
    // Property types to hide — matched against the object link text.
    static SKIP_PREFIXES = ['Банк', 'Частный дом', 'База синдиката', 'Магазин'];

    sortProperties() {
        const table = document.querySelector('table.withborders');
        if (!table) {
            return;
        }

        const body = table.tBodies[0];
        const [header, ...rows] = [...body.rows]; // first row is the column header

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

        // Rebuild: each sector gets a header row, then its property rows...
        groups.forEach((sectorRows, sector) => {
            body.appendChild(this.#groupHeader(sector, sectorRows, header.cells.length));
            sectorRows.forEach((row) => body.appendChild(row));
        });

        // ...then the remaining properties, in their original order, at the end.
        others.forEach((row) => body.appendChild(row));
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
        button.onclick = () => {
            sectorRows.forEach((row) => {
                const id = this.#objectId(row);
                if (id) {
                    window.open(`/objectedit.php?id=${id}`, '_blank');
                }
            });
        };

        cell.append(label, ' ', button);

        const tr = document.createElement('tr');
        tr.appendChild(cell);
        return tr;
    }
}
