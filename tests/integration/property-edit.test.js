import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, getByRole, queryByRole } from "@testing-library/dom";
import { loadPage } from "../helpers/loadPage";

const { storageKey, getShopSaveTimes, setShopSaveTime } = vi.hoisted(() => ({
  storageKey: "object-special-settings",
  getShopSaveTimes: vi.fn(() => ({})),
  setShopSaveTime: vi.fn(),
}));

vi.mock("js/settings", () => ({
  Settings: {
    productionBalance: 100000,
    resources: {},
    showButtons: { countShop: true },
    friends: [],
  },
}));

vi.mock("js/storage", () => ({
  Storage: {
    getSpecialSettings() {
      try {
        return JSON.parse(localStorage.getItem(storageKey) || "null");
      } catch {
        return null;
      }
    },
    setSpecialSettings(values) {
      localStorage.setItem(storageKey, JSON.stringify(values));
    },
    clearSpecialSettings() {
      localStorage.removeItem(storageKey);
    },
    getShopSaveTimes,
    setShopSaveTime,
    getCost: () => 0,
  },
}));

vi.mock("js/propertyInfo", () => ({ PropertyInfo: { record: vi.fn() } }));
vi.mock("js/app", () => ({ App: {} }));
vi.mock("js/http", () => ({ Http: { processWithDelay: vi.fn() } }));
vi.mock("js/fetchers", () => ({ Fetcher: {} }));
vi.mock("js/parsers", () => ({ Parse: {} }));

import { ObjectEdit } from "js/initialization/objectEdit";
import { Search } from "js/search";

function specialRows() {
  return ObjectEdit.specialSettingsRows(
    document.querySelector('textarea[name="objectdesc"]').parentElement
  );
}

beforeEach(() => {
  loadPage("property-edit");
  setShopSaveTime.mockReset();
  getShopSaveTimes.mockReset();
  getShopSaveTimes.mockReturnValue({});
  Search.controls = null;
});

describe("property-edit fixture contract", () => {
  test("retains the real forms and 2/6/6 special-setting rows", () => {
    expect(document.querySelector('[name="money_in"]')).not.toBeNull();
    expect(document.querySelector('[name="money_out"]')).not.toBeNull();
    expect(document.querySelector('textarea[name="objectdesc"]')).not.toBeNull();
    expect(specialRows().length).toBeGreaterThan(1);
    expect(
      specialRows().every((row) =>
        [...row.querySelectorAll("input")]
          .map((input) => input.getAttribute("size"))
          .join(",") === "2,6,6"
      )
    ).toBe(true);
  });
});

describe("special-settings transfer", () => {
  test("copies all values, enables paste, and uses non-submit buttons", () => {
    ObjectEdit.addSpecialSettingsTransfer();
    const copy = getByRole(document.body, "button", { name: "copy" });
    const paste = getByRole(document.body, "button", { name: "paste" });
    expect(copy.type).toBe("button");
    expect(paste.type).toBe("button");
    expect(paste.disabled).toBe(true);

    fireEvent.click(copy);
    const stored = JSON.parse(localStorage.getItem(storageKey));
    expect(stored).toHaveLength(specialRows().length);
    expect(stored[0]).toEqual(
      [...specialRows()[0].querySelectorAll("input")].map((input) => input.value)
    );
    expect(paste.disabled).toBe(false);
  });

  test("pastes compatible values once and then clears storage", () => {
    const rows = specialRows();
    const transferred = rows.map((_, index) => [
      String(index + 1),
      String(1000 + index),
      String(2000 + index),
    ]);
    localStorage.setItem(storageKey, JSON.stringify(transferred));

    ObjectEdit.addSpecialSettingsTransfer();
    const paste = getByRole(document.body, "button", { name: "paste" });
    expect(paste.disabled).toBe(false);
    fireEvent.click(paste);

    expect(
      [...rows.at(-1).querySelectorAll("input")].map((input) => input.value)
    ).toEqual(transferred.at(-1));
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(paste.disabled).toBe(true);
  });

  test.each([
    ["malformed JSON", "{bad"],
    ["different row count", JSON.stringify([["1", "2", "3"]])],
  ])("disables paste for %s", (_name, stored) => {
    localStorage.setItem(storageKey, stored);
    ObjectEdit.addSpecialSettingsTransfer();
    expect(getByRole(document.body, "button", { name: "paste" }).disabled).toBe(true);
  });

  test("does nothing without the description anchor", () => {
    document.querySelector('textarea[name="objectdesc"]').closest("form").remove();
    ObjectEdit.addSpecialSettingsTransfer();
    expect(queryByRole(document.body, "button", { name: "copy" })).toBeNull();
  });
});

describe("other property-edit features", () => {
  test("balances money and adds the quick reset", () => {
    ObjectEdit.balanceMoney();
    const moneyOut = document.querySelector('[name="money_out"]');
    expect(moneyOut.value).toBe("25000");
    fireEvent.click(moneyOut.closest("tr").querySelector(".money-reset"));
    expect(moneyOut.value).toBe("124990");
  });

  test("records the shop save time with the property id", () => {
    ObjectEdit.recordShopSave();
    const save = document.querySelector(
      'input[type="submit"][value="Сохранить настройки магазина"]'
    );
    save.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(save);
    expect(setShopSaveTime).toHaveBeenCalledOnce();
    expect(setShopSaveTime.mock.calls[0][0]).toBe("100001");
    expect(setShopSaveTime.mock.calls[0][1]).toEqual(expect.any(Number));
  });

  test("adds countShop controls to the captured shop table", () => {
    Search.init();
    expect(getByRole(document.body, "button", { name: "countShop" })).not.toBeNull();
    expect(getByRole(document.body, "button", { name: "apply all" }).disabled).toBe(true);
  });

  test("shows a completed save cooldown beside the property link", () => {
    const now = 2_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    getShopSaveTimes.mockReturnValue({
      100001: now - 4 * 60 * 60 * 1000,
    });

    ObjectEdit.showShopTimers();
    const indicator = document.querySelector('a[href*="object.php?id=100001"] + span');
    expect(indicator.className).toBe("green");
    expect(indicator.textContent.trim()).toBe("✓");
  });
});
