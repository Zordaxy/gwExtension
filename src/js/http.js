import { ajax } from 'rxjs/ajax';
import { catchError } from 'rxjs/operators';

export const Http = {
    get(url) {
        return ajax({
            url: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            responseType: 'text'
        }).pipe(
            catchError(error => {
                return of(error);
            })
        );
    },

    post(url) {
        return ajax({
            url: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            responseType: 'text'
        }).pipe(
            catchError(error => {
                return of(error);
            })
        );
    },

    async fetchGet(url) {
        const response = await fetch(url, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        const buffer = await response.arrayBuffer();
        let decoder = new TextDecoder("windows-1251");
        const text = decoder.decode(buffer);

        const parser = new DOMParser();
        const htmlDocument = parser.parseFromString(text, "text/html");
        return htmlDocument;
    },

    async processWithDelay(array, callback, interval = 400) {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (const element of array) {
            await callback(element);
            await delay(interval);
        }

        return Promise.resolve();
    }
}

// function oldAjaxQuery(url, method, param, onSuccess, onFailure) {
//     let xmlHttpRequest = new XMLHttpRequest();
//     xmlHttpRequest.onreadystatechange = () => {
//         if (xmlHttpRequest.readyState === 4 && xmlHttpRequest.status === 200 && onSuccess) onSuccess(xmlHttpRequest);
//         else if (xmlHttpRequest.readyState === 4 && xmlHttpRequest.status !== 200 && onFailure) onFailure(xmlHttpRequest);
//     };
//     xmlHttpRequest.open(method, url, true);

//     if (method === 'POST') xmlHttpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
//     xmlHttpRequest.send(param);
// }