// Extends production list with extra field
// Add ProductionOnG to execution

async function decode(response) {
    const buffer = await response.arrayBuffer();
    let decoder = new TextDecoder("windows-1251");
    const text = decoder.decode(buffer);

    const parser = new DOMParser();
    const htmlDocument = parser.parseFromString(text, "text/html");
    return htmlDocument
}

async function fetchDurability(id) {
    const response = await fetch(`https://www.gwars.io/item.php?item_id=${id}`);
    const decoded = await decode(response);
    return decoded;
}

function extendJson(string, field) {
    field = field ?? 0;
    const jsonBackOpened = JSON.stringify(string)
        .slice(0, -1);
    const result = `${jsonBackOpened}, "durability":${field}}`;
    return result.replace(/"(\w+)":/g, '$1:');
}

async function processWithDelay(array, callback, interval = 400) {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const element of array) {
        await callback(element);
        await delay(interval);
    }

    return Promise.resolve();
}

function updateWithDurability(list) {
    processWithDelay(list, row => {
        fetchDurability(row.id)
            .then((content) => {
                const pElements = content.querySelectorAll('table table b')
                let durabilityElement = [].filter.call(pElements, elem => {
                    return elem.textContent.trim() === "Прочность:";
                })[0];

                const textNode = durabilityElement?.nextSibling?.nodeValue?.trim();
                const durability = textNode?.match(/^\d+/)?.[0]; // Extract the first number (25)
                return durability;
            }).
            then((durability) => {
                console.log(`${extendJson(row, durability)},`);
            })
    });
}

updateWithDurability(ProductionOnG);