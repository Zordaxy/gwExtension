import { App } from "./js/app";
import { Settings } from "./js/settings";

console.log("Initialize GW Checker");

// Load persisted settings from chrome.storage before anything reads Settings.
Settings.load().then(() => App.init());
