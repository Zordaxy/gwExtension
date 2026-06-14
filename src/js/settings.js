import {
  STORAGE_KEY,
  cloneDefaults,
  mergeOverrides,
  readOverrides,
} from "./settingsConfig";

export const Settings = {
  // Not user-editable (no popup controls for these).
  friends: ["Michegan"],
  rentOwners: new Map([]),
  domain: "https://www.gwars.io",

  // User-editable defaults (resources, funnyDigit, showButtons, eco).
  // Overwritten in place by load() before App.init() runs, so every
  // synchronous `Settings.x` read elsewhere keeps working unchanged.
  ...cloneDefaults(),

  // Merge persisted overrides from chrome.storage over the defaults.
  // Call once at startup, before anything reads Settings.
  async load() {
    Object.assign(this, mergeOverrides(await readOverrides()));
    this.watch();
  },

  // Keep Settings in sync with popup edits without a page reload: whenever the
  // popup saves, re-merge the new overrides in place. Features that read
  // Settings at call time (e.g. "check prices" via Storage.getCost) then use
  // the new values immediately. Note: UI built once at startup (which buttons
  // show) still needs a reload.
  watch() {
    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (area === "local" && changes[STORAGE_KEY]) {
        Object.assign(this, mergeOverrides(changes[STORAGE_KEY].newValue || {}));
      }
    });
  },
};
