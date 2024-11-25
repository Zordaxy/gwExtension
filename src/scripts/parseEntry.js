function parseEntry(entry) {
    const island = entry.substring(1, 2);
    const name = entry.substring(3, entry.length - 3).trim();
    return { name, island };
}

let list = [...document.querySelector('[id="goods"]')
    .querySelectorAll('option')]
    .map(option => option.innerText)
    .map(option => parseEntry(option))
    .filter(option => option.island === 'Z')
    .map(option => option.name)
    .map(option => `{ name: '${option}' }`)
    .join(', ')
list;

function parseResources(name) {
    function getResName(node) {
        return node.parentNode.parentNode.querySelector('td').innerText;
    }

    const hours = document.querySelector('[id="whour"]').value;
    const power = document.querySelector('[id="qty_pitem_1"]').value;
    const res1 = document.querySelector('[id="qty_item_1"]');
    const res2 = document.querySelector('[id="qty_item_2"]');
    const res3 = document.querySelector('[id="qty_item_3"]');
    const res4 = document.querySelector('[id="qty_item_4"]');
    const res5 = document.querySelector('[id="qty_item_5"]');

    return `{ name: '${name}', id: '', hours: ${hours}, power: ${power}, ${getResName(res1)}: ${res1.value}, ${getResName(res2)}: ${res2.value}, ${getResName(res3)}: ${res3.value}, ${getResName(res4)}: ${res4.value}${res5 ? ", " + getResName(res5) + ': ' + res4.value : ''} },`;
}
parseResources('AAT m.52');