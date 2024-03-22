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