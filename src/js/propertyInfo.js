import { Ordinal } from "data/ordinal";
import { Storage } from "js/storage";

export const PROPERTY_SKIP_PREFIXES = [
    "Банк",
    "Частный дом",
    "База синдиката",
    "Магазин",
];

export const PropertyInfo = {
    record(doc, propertyId) {
        if (!propertyId) {
            return;
        }

        if (!this.isManaged(doc)) {
            Storage.removePropertyInfo(propertyId);
            return;
        }

        const ids = new Set();
        doc.querySelectorAll('input[name^="price"]').forEach((input) => {
            const match = input.name.match(/\[(.+)\]/);
            if (match) {
                ids.add(match[1]);
            }
        });
        doc
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
        const storedTypes = Storage.getPropertyTypes()[propertyId];
        if (JSON.stringify(storedTypes) !== JSON.stringify(shopTypes)) {
            Storage.setPropertyTypes(propertyId, shopTypes);
        }

        if (
            PROPERTY_SKIP_PREFIXES.some((prefix) =>
                this.name(doc).startsWith(prefix)
            )
        ) {
            Storage.removePropertyResources(propertyId);
            return;
        }

        const resources = this.producedItems(doc);
        const storedResources = Storage.getPropertyResources()[propertyId];
        if (JSON.stringify(storedResources) !== JSON.stringify(resources)) {
            Storage.setPropertyResources(propertyId, resources);
        }
    },

    isManaged(doc) {
        return (doc.body?.textContent || "").includes(
            "редактировать информацию о вашей постройке »"
        );
    },

    name(doc) {
        const title = doc.title || "";
        const parens = title.match(/\(([^)]+)\)/);
        return (parens ? parens[1] : title.split(" в ")[0]).trim();
    },

    producedItems(doc) {
        const ids = new Set();

        doc.querySelectorAll('input[name^="pricep["]').forEach((input) => {
            const match = input.name.match(/\[(.+)\]/);
            if (match) {
                ids.add(match[1]);
            }
        });

        const header = [...doc.querySelectorAll("td")].find(
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
};
