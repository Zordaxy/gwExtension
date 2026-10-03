import { expect, test, vi } from "vitest";
import { fireEvent } from "@testing-library/dom";

vi.mock("js/storage", () => ({ Storage: { getPropertyTypes: () => ({}) } }));

import { Realty } from "js/features/realty";

test.each([
  ["[data-test-realty-show-all]", "click"],
  ["[data-test-realty-show-all]", "contextMenu"],
  ["[data-test-realty-show-all-link]", "click"],
  ["[data-test-realty-show-all-link]", "contextMenu"],
])("%s %s opens one page at a time, reactivates, and waits 300ms", async (selector, eventName) => {
    vi.useFakeTimers();
    const reactivate = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("chrome", { runtime: { sendMessage: reactivate } });
    try {
      document.body.innerHTML = `<table class="withborders"><tbody>
        <tr><th>Property</th><th>Sector</th></tr>
        ${[101, 102, 103].map((id) => `<tr><td><a href="/object.php?id=${id}">Завод</a></td><td>Sector</td></tr>`).join("")}
      </tbody></table>`;
      const open = vi.spyOn(window, "open").mockImplementation(() => null);
      const focus = vi.spyOn(window, "focus").mockImplementation(() => {});
      new Realty().sortProperties();
      const control = document.querySelector(selector);
      expect(control).not.toBeNull();
      const check = control.previousElementSibling;
      expect(check.classList.contains("realty-show-all-check")).toBe(true);
      expect(check.textContent.trim()).toBe("✓");
      expect(check.style.visibility).toBe("hidden");
      expect(fireEvent[eventName](control)).toBe(false);
      expect(open).toHaveBeenCalledTimes(1);
      expect(reactivate).toHaveBeenCalledExactlyOnceWith({ type: "reactivate-realty-tab" });
      await vi.advanceTimersByTimeAsync(299);
      expect(open).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(open).toHaveBeenCalledTimes(2);
      expect(reactivate).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "/object.php?id=101", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "/object.php?id=102", "_blank");
      await vi.advanceTimersByTimeAsync(299);
      expect(open).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(open).toHaveBeenCalledTimes(3);
      expect(open).toHaveBeenNthCalledWith(3, "/object.php?id=103", "_blank");
      expect(focus).not.toHaveBeenCalled();
      expect(reactivate).toHaveBeenCalledTimes(3);
      expect(check.style.visibility).toBe("hidden");
      await vi.advanceTimersByTimeAsync(300);
      expect(focus).not.toHaveBeenCalled();
      expect(reactivate).toHaveBeenCalledTimes(3);
      expect(check.style.visibility).toBe("visible");
      fireEvent[eventName](control);
      expect(check.style.visibility).toBe("hidden");
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });
