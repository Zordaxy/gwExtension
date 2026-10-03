import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fireEvent, getByRole } from "@testing-library/dom";
import { loadPage } from "../helpers/loadPage";

const { getMissing } = vi.hoisted(() => ({ getMissing: vi.fn() }));
vi.mock("js/storage", () => ({ Storage: { getMissing } }));
vi.mock("js/settings", () => ({ Settings: {} }));
vi.mock("js/propertyInfo", () => ({ PropertyInfo: { record: vi.fn() } }));

import { ObjectEdit } from "js/initialization/objectEdit";

const inputs = () => [...document.querySelectorAll('input[name="am_out"]')];
const resource = (input) => input.closest("tr").querySelector('[name="resource"]').value;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", vi.fn());
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  loadPage("storage");
  getMissing.mockReturnValue({});
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("adds one load link at the end of the house title with reserved check space", () => {
  expect(inputs()).toHaveLength(11);
  expect(document.querySelector(".refill-all")).toBeNull();
  ObjectEdit.addRefillButton();
  ObjectEdit.addRefillButton();
  const button = getByRole(document.body, "link", { name: "load" });
  expect(button.getAttribute("href")).toBe("#");
  expect(getByRole(document.body, "link", { name: "unload" }).getAttribute("href")).toBe("#");
  expect(document.querySelectorAll("[data-test-fill-storage-counts]")).toHaveLength(1);
  expect(button.closest("td").textContent).toContain("Частный дом");
  expect(button.parentElement.parentElement.tagName).toBe("CENTER");
  expect(button.previousElementSibling.textContent).toBe(" ✓");
  expect(button.previousElementSibling.style.visibility).toBe("hidden");
});

test("fills net counts, stably moves positive withdrawals up, and scrolls the table", () => {
  getMissing.mockReturnValue({ defender: 3, pasfgt: 8, technite: 9000 });
  const original = inputs();
  const defender = original.find((input) => resource(input) === "defender");
  defender.closest("tr").cells[2].textContent = "1";
  const table = original[0].closest("table");
  const header = table.rows[0];
  const total = table.rows[table.rows.length - 1];
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("innerHeight", 1000);
  vi.spyOn(table, "getBoundingClientRect").mockReturnValue({ top: 300 });
  const originalForms = original.map((input) => input.closest("tr").querySelector("form"));
  ObjectEdit.addRefillButton();
  const button = getByRole(document.body, "link", { name: "load" });
  fireEvent.click(button);

  expect(defender.value).toBe("2");
  expect(inputs().find((input) => resource(input) === "pasfgt").value).toBe("6");
  expect(inputs().slice(0, 2).map(resource)).toEqual(["defender", "pasfgt"]);
  expect(inputs().slice(2).map(resource)).toEqual(
    original.filter((input) => !["defender", "pasfgt"].includes(resource(input))).map(resource)
  );
  expect(inputs().find((input) => resource(input) === "technite").value).toBe("0");
  expect(table.rows[0]).toBe(header);
  expect(table.rows[table.rows.length - 1]).toBe(total);
  original.forEach((input, index) => {
    expect(input.closest("tr").querySelector("form")).toBe(originalForms[index]);
    expect(input.closest("tr").querySelector('[name="am_in"]').value).toBe("0");
  });
  expect(button.previousElementSibling.style.visibility).toBe("visible");
  expect(defender.closest("tr").classList.contains("storage-count-changed")).toBe(true);
  expect(original[0].closest("tr").classList.contains("storage-count-changed")).toBe(false);
  vi.advanceTimersByTime(99);
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  const startedAt = performance.now();
  const animate = requestAnimationFrame.mock.calls[0][0];
  animate(startedAt + 250);
  expect(scroll).toHaveBeenLastCalledWith({ top: 0.78125, behavior: "instant" });
  animate(startedAt + 500);
  expect(scroll).toHaveBeenLastCalledWith({ top: 50, behavior: "instant" });
  animate(startedAt + 750);
  expect(scroll).toHaveBeenLastCalledWith({ top: 99.21875, behavior: "instant" });
  expect(document.activeElement).not.toBe(defender);
  animate(startedAt + 1000);
  expect(scroll).toHaveBeenLastCalledWith({ top: 100, behavior: "instant" });
  expect(document.activeElement).toBe(defender);
  fireEvent.click(button);
  expect(document.querySelector(".storage-count-changed")).toBeNull();
  expect(inputs().slice(0, 2).map(resource)).toEqual(["defender", "pasfgt"]);
});

test("keeps row order when no counts are remembered", () => {
  const original = inputs();
  original[0].closest("table").scrollIntoView = vi.fn();
  ObjectEdit.refillMissing();
  expect(inputs()).toEqual(original);
  expect(inputs().every((input) => input.value === "0")).toBe(true);
});

 test("unload fills deposits from owned counts, sorts, highlights, and focuses deposits", () => {
  const owned = inputs().find((input) => resource(input) === "technite").closest("tr");
  const deposit = owned.querySelector('[name="am_in"]');
  deposit.value = "7";
  const techniteIndex = [...owned.closest("table").rows].indexOf(owned);
  const refillRow = inputs().find((input) => resource(input) === "defender").closest("tr");
  refillRow.cells[2].textContent = "12";
  const refillDeposit = refillRow.querySelector('[name="am_in"]');
  const emptyDeposit = inputs()[0].closest("tr").querySelector('[name="am_in"]');
  emptyDeposit.value = "5";
  const table = owned.closest("table");
  const header = table.rows[0];
  const total = table.rows[table.rows.length - 1];
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  ObjectEdit.addRefillButton();
  const unload = getByRole(document.body, "link", { name: "unload" });
  fireEvent.click(unload);
  expect(deposit.value).toBe("7");
  expect(refillDeposit.value).toBe("12");
  expect(emptyDeposit.value).toBe("0");
  expect(table.rows[1]).toBe(refillRow);
  expect(table.rows[techniteIndex]).toBe(owned);
  expect(table.rows[0]).toBe(header);
  expect(table.rows[table.rows.length - 1]).toBe(total);
  expect(owned.classList.contains("storage-count-changed")).toBe(false);
  expect(inputs().every((input) => input.value === "0")).toBe(true);
  expect(unload.previousElementSibling.style.visibility).toBe("visible");
  vi.advanceTimersByTime(100);
  requestAnimationFrame.mock.calls[0][0](performance.now() + 1000);
  expect(document.activeElement).toBe(refillDeposit);
});
