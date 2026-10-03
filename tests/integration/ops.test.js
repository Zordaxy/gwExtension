import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, getByRole, queryByRole } from "@testing-library/dom";
import { ActionButtons } from "js/features/actionButtons";
import { loadPage } from "../helpers/loadPage";

const originalUrl = window.location.href;
let completionListener;

beforeEach(() => {
  completionListener = undefined;
  vi.stubGlobal("chrome", { runtime: { onMessage: {
    addListener: vi.fn((callback) => { completionListener = callback; }),
  } } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", originalUrl);
});

describe.each([
  ["ops", "/ops.php"],
  ["questlog", "/questlog.php?id=100001"],
])("%s quest-set shortcut", (fixture, pageUrl) => {
  beforeEach(() => {
    window.history.replaceState({}, "", pageUrl);
    loadPage(fixture);
  });
  test.each([["quest set", "7"], ["main set", "2"]])
    ("adds bold green %s without underline and opens its action in a new tab", (name, setId) => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const originalPage = window.location.href;
    ActionButtons.init();

    const heading = getByRole(document.body, "heading", { name: "Доступные операции" });
    const link = getByRole(document.body, "link", { name });
    if (setId === "7") expect(heading.nextElementSibling).toBe(link.previousElementSibling);
    expect(link.getAttribute("href")).toBe(`/home.do.php?putset=${setId}`);
    expect(link.classList.contains("green")).toBe(true);
    expect(link.style.fontWeight).toBe("bold");
    expect(link.style.color).toBe("rgb(0, 153, 0)");
    expect(link.style.textDecoration).toBe("none");
    expect(link.style.borderBottom).toBe("");
    expect(link.target).toBe("_blank");
    expect(link.getAttribute("onclick")).toBeNull();
    expect(fireEvent.click(link)).toBe(false);
    expect(open).toHaveBeenCalledExactlyOnceWith(`https://www.gwars.io/home.do.php?putset=${setId}`, "_blank");
    expect(window.location.href).toBe(originalPage);
    expect(getByRole(document.body, "link", { name: "Складские рейды" })).not.toBeNull();
  });

  test("does not duplicate the shortcut on repeated initialization", () => {
    ActionButtons.init();
    ActionButtons.init();
    expect(document.querySelectorAll("#gw-wear-quest-set")).toHaveLength(1);
    expect(document.querySelectorAll("#gw-wear-main-set")).toHaveLength(1);
    expect(document.querySelectorAll(".quest-set-check")).toHaveLength(1);
    expect(document.querySelectorAll(".main-set-check")).toHaveLength(1);
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledOnce();
  });

  test.each([
    ["7", "gw-wear-quest-set", "quest-set-check", "main-set-check"],
    ["2", "gw-wear-main-set", "main-set-check", "quest-set-check"],
  ])("shows only set %s's check on completion and resets it on the next click", (setId, id, checkClass, otherClass) => {
    ActionButtons.addQuestSetLink();
    vi.spyOn(window, "open").mockImplementation(() => null);
    const link = document.getElementById(id);
    const check = link.previousElementSibling;
    expect(check.classList.contains(checkClass)).toBe(true);
    expect(check.textContent.trim()).toBe("✓");
    expect(check.style.visibility).toBe("hidden");
    const respond = vi.fn();
    completionListener({ type: "unrelated" }, {}, respond);
    expect(check.style.visibility).toBe("hidden");
    completionListener({ type: "equipment-set-completed", setId }, {}, respond);
    expect(check.style.visibility).toBe("visible");
    expect(document.querySelector(`.${otherClass}`).style.visibility).toBe("hidden");
    expect(respond).toHaveBeenCalledWith({ ok: true });
    fireEvent.click(link);
    expect(check.style.visibility).toBe("hidden");
  });

  test("does not add a shortcut on another page", () => {
    window.history.replaceState({}, "", "/home.php");
    ActionButtons.init();
    expect(queryByRole(document.body, "link", { name: "quest set" })).toBeNull();
    expect(queryByRole(document.body, "link", { name: "main set" })).toBeNull();
  });

  test("handles operation detail pages without the available-operations heading", () => {
    window.history.replaceState({}, "", "/ops.php?cls=warehouse");
    document.querySelector(".opclisthead").remove();
    expect(() => ActionButtons.init()).not.toThrow();
    expect(queryByRole(document.body, "link", { name: "quest set" })).toBeNull();
    expect(queryByRole(document.body, "link", { name: "main set" })).toBeNull();
  });
});

