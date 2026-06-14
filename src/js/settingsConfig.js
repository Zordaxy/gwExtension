// Shared between the content script (settings.js) and the extension popup (popup.js).
// These are the only settings the user can edit through the popup menu.
// The popup writes overrides to chrome.storage.local[STORAGE_KEY]; the content
// script merges them over these defaults at startup via Settings.load().

export const STORAGE_KEY = "gwSettings";

export const EDITABLE_DEFAULTS = {
  resources: {
    hours: 275,
    uranium: 195,
    ganjium: 197,
    steel: 20,
    aluminium: 292,
    solomka: 45,
    grass: 42,
    boxites: 34,
    oil: 37,
    seaweed: 33,
    plastic: 360,
    rubber: 288,
    battery: 238,
  },
  funnyDigit: "",
  productionBalance: 1000000,
  showButtons: {
    prices: true,
    bag: true,
    advertisement: true,
    countShop: true,
    eco: true,
  },
  eco: 1.9,
};

// objectedit.php names its resource price inputs (pricer[<code>]) with the
// game's internal codes, two of which differ from the keys in
// EDITABLE_DEFAULTS.resources above. List those exceptions here; every other
// code matches a resource key directly, so callers fall back to the code itself.
export const RESOURCE_PAGE_CODES = {
  metal: "steel", // Сталь
  uran: "uranium", // Уран
};

// Deep clone helper — the editable defaults are JSON-safe (numbers/strings/booleans/plain objects).
export const cloneDefaults = () => JSON.parse(JSON.stringify(EDITABLE_DEFAULTS));

// Merge persisted overrides over fresh defaults and return a new object.
// Shared by Settings.load() (content script) and the popup so the merge
// semantics stay in one place. Nested defaults keep sub-keys the user never
// overrode, so adding a new resource/button later is forward-compatible.
export function mergeOverrides(overrides) {
  const values = cloneDefaults();
  for (const key of Object.keys(values)) {
    if (overrides[key] === undefined) continue;
    const def = values[key];
    values[key] =
      def && typeof def === "object" ? { ...def, ...overrides[key] } : overrides[key];
  }
  return values;
}

// Read persisted overrides from chrome.storage.local. Returns {} outside the
// extension context or on any error, so callers always get a usable object.
export async function readOverrides() {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return data?.[STORAGE_KEY] || {};
  } catch {
    return {};
  }
}

// Persist the editable subset (resources, funnyDigit, showButtons, eco).
export async function writeOverrides(overrides) {
  await chrome.storage.local.set({ [STORAGE_KEY]: overrides });
}
