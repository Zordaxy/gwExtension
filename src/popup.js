import {
  cloneDefaults,
  mergeOverrides,
  readOverrides,
  writeOverrides,
} from "./js/settingsConfig";

const form = document.getElementById("settings");
const status = document.getElementById("status");

// Input names are paths ("eco" or "resources.hours") into the editable shape.
const pathOf = (name) => name.split(".");

function valueAt(obj, name) {
  const [group, key] = pathOf(name);
  return key ? obj[group]?.[key] : obj[group];
}

function setAt(obj, name, value) {
  const [group, key] = pathOf(name);
  if (key) obj[group][key] = value;
  else obj[group] = value;
}

// Defaults overlaid with persisted overrides.
async function currentValues() {
  return mergeOverrides(await readOverrides());
}

function fillForm(values) {
  for (const input of form.elements) {
    if (!input.name) continue;
    const value = valueAt(values, input.name);
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = value;
  }
}

function readForm() {
  const result = cloneDefaults();
  for (const input of form.elements) {
    if (!input.name) continue;

    if (input.type === "checkbox") {
      setAt(result, input.name, input.checked);
    } else if (input.type === "number") {
      // Blank or non-numeric input keeps the default rather than persisting
      // 0/NaN, which would silently corrupt cost/price calculations.
      const n = Number(input.value);
      if (input.value.trim() === "" || !Number.isFinite(n)) continue;
      setAt(result, input.name, n);
    } else {
      setAt(result, input.name, input.value);
    }
  }
  return result;
}

function flash(message) {
  status.textContent = message;
  status.classList.add("status--show");
  setTimeout(() => status.classList.remove("status--show"), 1500);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await writeOverrides(readForm());
    flash("Saved");
  } catch {
    flash("Save failed");
  }
});

document.getElementById("reset").addEventListener("click", async () => {
  try {
    await writeOverrides(cloneDefaults());
    fillForm(await currentValues());
    flash("Reset to defaults");
  } catch {
    flash("Reset failed");
  }
});

currentValues().then(fillForm);
