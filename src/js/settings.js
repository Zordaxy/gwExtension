import { cloneDefaults, mergeOverrides, readOverrides } from "./settingsConfig";

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
  // Call once at startup, before anything reads Settings. Edits made in the
  // popup take effect on the next page load.
  async load() {
    Object.assign(this, mergeOverrides(await readOverrides()));
  },
};
