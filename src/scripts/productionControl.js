async function execute(propertyId, startTime) {
    let running = true;
    let totalGb = 0;
    let page = -1;

    while (running) {
        page++;

        const response = await fetchGet(`https://www.gwars.io/object-pts-log.php?id=${propertyId}&page_id=${page}`);
        const nobrElements = response.querySelectorAll('nobr');
        const { pageTotalGb, isFinished } = parseNodes(nobrElements, startTime);

        totalGb += pageTotalGb;
        running = !isFinished;
    }
    console.log(`Total Гб: ${totalGb}`);
}

function constructDate(dateStr) {
    const [day, month, yearTime] = dateStr.split('.'); // Extract the day, month, and year/time
    const [year, time] = yearTime.split(' '); // Extract the year and time
    return new Date(`20${year}-${month}-${day}T${time}:00`);
}

function parseNodes(nobrElements, startTime) {
    let pageTotalGb = 0;
    let isFinished = false;
    let lastDate = null;
    nobrElements.forEach(nobr => {
        const dateText = nobr.querySelector('font')?.textContent.trim(); // Extract the date and time
        if (dateText) {
            lastDate = constructDate(dateText); // Construct a Date object from the extracted time

            if (lastDate >= startTime) {
                const gbMatch = nobr.textContent.match(/(\d+\.?\d*) Гб/); // Regex to match "42 Гб" or "1.2 Гб"
                if (gbMatch && nobr.textContent.includes('#6001')) {
                    pageTotalGb += parseFloat(gbMatch[1]); // Add the value to totalGb
                }
            } else {
                isFinished = true;
            }
        }
    });


    console.log("Running on:", lastDate);
    return { pageTotalGb, isFinished };
}

async function fetchGet(url) {
    const resp = await fetch(url, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const buffer = await resp.arrayBuffer();
    let decoder = new TextDecoder("windows-1251");
    const text = decoder.decode(buffer);

    const parser = new DOMParser();
    const htmlDocument = parser.parseFromString(text, "text/html");
    return htmlDocument;
}

const startTime = new Date('2024-09-24T07:00:00');
const propertyId = 176532;
execute(propertyId, startTime);
