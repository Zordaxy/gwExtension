define(['storage', 'widgets'], function () {
    function ajaxQuery (url, method, param, onSuccess, onFailure) {
        let xmlHttpRequest = new XMLHttpRequest();
        xmlHttpRequest.onreadystatechange = function () {
            if (xmlHttpRequest.readyState === 4 && xmlHttpRequest.status === 200 && onSuccess) onSuccess(xmlHttpRequest);
            else if (xmlHttpRequest.readyState === 4 && xmlHttpRequest.status !== 200 && onFailure) onFailure(xmlHttpRequest);
        };
        xmlHttpRequest.open(method, url, true);

        if (method === 'POST') xmlHttpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xmlHttpRequest.send(param);
    }

    return {
        ajaxQuery: ajaxQuery,
    }
});



