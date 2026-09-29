import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, getByRole, queryByRole } from "@testing-library/dom";
import { JSDOM } from "jsdom";
import { ActionButtons } from "js/features/actionButtons";
import { loadPage } from "../helpers/loadPage";

const originalUrl = window.location.href;

beforeEach(() => {
  window.history.replaceState({}, "", "/ops.php");
  loadPage("ops");
});

afterEach(() => {
  window.history.replaceState({}, "", originalUrl);
});

describe("operations quest-set shortcut", () => {
  test("adds the shortcut beside the captured heading and calls the game handler", () => {
    const postdo = vi.fn(() => false);
    ActionButtons.init();

    const heading = getByRole(document.body, "heading", { name: "Доступные операции" });
    const link = getByRole(document.body, "link", { name: "wear quest set" });
    expect(heading.nextElementSibling).toBe(link);
    expect(link.getAttribute("href")).toBe("/home.do.php?putset=7");
    // Execute the generated inline handler in a page realm, like the game's
    // own postdo function (separate from the extension/content-script globals).
    const page = new JSDOM(link.outerHTML, {
      url: "https://www.gwars.io/ops.php",
      runScripts: "dangerously",
    });
    try {
      page.window.postdo = postdo;
      expect(postdo).not.toHaveBeenCalled();
      expect(fireEvent.click(page.window.document.querySelector("a"))).toBe(false);
      expect(postdo).toHaveBeenCalledExactlyOnceWith("/home.do.php?putset=7");
    } finally {
      page.window.close();
    }
    expect(getByRole(document.body, "link", { name: "Складские рейды" })).not.toBeNull();
  });

  test("does not duplicate the shortcut on repeated initialization", () => {
    ActionButtons.init();
    ActionButtons.init();
    expect(document.querySelectorAll("#gw-wear-quest-set")).toHaveLength(1);
  });

  test("does not add a shortcut on another page", () => {
    window.history.replaceState({}, "", "/home.php");
    ActionButtons.init();
    expect(queryByRole(document.body, "link", { name: "wear quest set" })).toBeNull();
  });

  test("handles operation detail pages without the available-operations heading", () => {
    window.history.replaceState({}, "", "/ops.php?cls=warehouse");
    document.querySelector(".opclisthead").remove();
    expect(() => ActionButtons.init()).not.toThrow();
    expect(queryByRole(document.body, "link", { name: "wear quest set" })).toBeNull();
  });
});

