import { Http } from './http';
import { Parse } from './parse';
import { AddLine } from './addLine';

export const Search = {
    // TODO: move to widgets
    async findShopPrices() {
        const island = document.querySelectorAll('table table a b')?.[1]?.innerText?.substring(1, 2);
        if (island !== "G" && island !== "Z") {
            console.log("[Island parsing error] - island not found in shop page. Found: ", island);
            return;
        }
        let rows = document.querySelector("form[action='/objectedit.php'] table[cellpadding='4']").rows;
        let filteredRows = Array.prototype.filter.call(rows, elem => {
            const count = +elem.querySelectorAll("td")[1]?.innerText;
            const resourceId = elem.querySelectorAll("td input[name]")?.[0]?.name?.slice(7, -1)
            return count !== 0 && resourceId && !isNaN(count);
        });

        Http.processWithDelay(filteredRows, async (row) => {
            let inputPriceLine = row.querySelectorAll("td input[name]");
            let resourceId = inputPriceLine[0].name.slice(7, -1);

            const parsedShops = await Parse.parseShopsPrice(resourceId);
            const localData = parsedShops[island];

            if (localData?.isNoOffers) {
                await new Promise(resolve => setTimeout(resolve, 200));
                localData.minPrice = await Parse.parseSellersPrice(resourceId, island);
            }
            AddLine.appendShopCount(row, localData, resourceId);
        })
    }
}