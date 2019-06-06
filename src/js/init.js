// ==UserScript==
// @name            Price Checker
// @namespace       http://www.ukr.net
// @description     Shows prices hints
// @include         http://ganjawars.ru/*
// @include         http://*.ganjawars.ru/*
// @grant           none
// @version         2.0
// @author          Michegan
// ==/UserScript==

require.config({
    paths: {
        templates: "../templates"
    }
});

require(["app"], function (app) {
    console.log("Initialize GW Checker");
    app.init();
});
