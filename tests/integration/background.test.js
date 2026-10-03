import { afterEach, beforeEach, expect, test, vi } from "vitest";

let listener;
let updateTab;
let updateWindow;
let created;
let completed;
let removed;
let removeTab;
let getFrame;
let session;
let notifyTab;

beforeEach(async () => {
    vi.resetModules();
    updateTab = vi.fn().mockResolvedValue({});
    updateWindow = vi.fn().mockResolvedValue({});
    removeTab = vi.fn().mockResolvedValue();
    notifyTab = vi.fn().mockResolvedValue({ ok: true });
    getFrame = vi.fn().mockResolvedValue({ url: "https://www.gwars.io/ops.php" });
    session = {};
    vi.stubGlobal("chrome", {
        runtime: { onMessage: { addListener: (callback) => { listener = callback; } } },
        tabs: { update: updateTab, remove: removeTab, sendMessage: notifyTab,
            onRemoved: { addListener: (callback) => { removed = callback; } } },
        windows: { update: updateWindow },
        webNavigation: {
            getFrame,
            onCreatedNavigationTarget: { addListener: (callback) => { created = callback; } },
            onCompleted: { addListener: (callback) => { completed = callback; } },
        },
        storage: { session: {
            set: vi.fn(async (values) => Object.assign(session, values)),
            get: vi.fn(async (key) => ({ [key]: session[key] })),
            remove: vi.fn(async (key) => { delete session[key]; }),
        } },
    });
    await import("../../src/assets/background.js");
});

afterEach(() => vi.unstubAllGlobals());

test("reactivates the sender's existing tab and window without navigating", async () => {
    const respond = vi.fn();
    expect(listener({ type: "reactivate-realty-tab", tabId: 999 },
        { tab: { id: 101, windowId: 7 } }, respond)).toBe(true);
    await vi.waitFor(() => expect(respond).toHaveBeenCalledWith({ ok: true }));
    expect(updateTab).toHaveBeenCalledExactlyOnceWith(101, { active: true });
    expect(updateWindow).toHaveBeenCalledExactlyOnceWith(7, { focused: true });
});

test("doesn't activate anything when the message has no sender tab", () => {
    const respond = vi.fn();
    listener({ type: "reactivate-realty-tab", tabId: 999 }, {}, respond);
    expect(updateTab).not.toHaveBeenCalled();
    expect(updateWindow).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith({ ok: false });
});

test("reports failure if the original tab has been closed", async () => {
    updateTab.mockRejectedValue(new Error("No tab"));
    const respond = vi.fn();
    listener({ type: "reactivate-realty-tab" }, { tab: { id: 101, windowId: 7 } }, respond);
    await vi.waitFor(() => expect(respond).toHaveBeenCalledWith({ ok: false }));
    expect(updateWindow).not.toHaveBeenCalled();
});

test.each([
    ["/ops.php", "7"], ["/questlog.php?id=100001", "7"],
    ["/ops.php", "2"], ["/questlog.php?id=100001", "2"],
])("equipment action returns to %s for set %s and keeps the action tab open", async (sourcePath, setId) => {
    getFrame.mockResolvedValue({ url: `https://www.gwars.io${sourcePath}` });
    updateTab.mockResolvedValue({ windowId: 7 });
    created({ url: `https://www.gwars.io/home.do.php?putset=${setId}`,
        sourceTabId: 101, sourceFrameId: 0, tabId: 202 });
    expect(removeTab).not.toHaveBeenCalled();
    expect(notifyTab).not.toHaveBeenCalled();
    // A redirect can land on another page; completion still belongs to this tab.
    await completed({ tabId: 202, frameId: 0, url: "https://www.gwars.io/home.php" });
    expect(updateTab).toHaveBeenCalledExactlyOnceWith(101, { active: true });
    expect(updateWindow).toHaveBeenCalledExactlyOnceWith(7, { focused: true });
    expect(removeTab).not.toHaveBeenCalled();
    expect(notifyTab).toHaveBeenCalledExactlyOnceWith(101, { type: "equipment-set-completed", setId });
    expect(notifyTab.mock.invocationCallOrder[0]).toBeGreaterThan(updateWindow.mock.invocationCallOrder[0]);
    expect(session).toEqual({});
});

test.each([
    ["https://www.gwars.io/home.do.php?putset=8", "https://www.gwars.io/ops.php"],
    ["https://www.gwars.io/object.php?id=202", "https://www.gwars.io/ops.php"],
    ["https://www.gwars.io/home.do.php?putset=7", "https://www.gwars.io/home.php"],
])("does not close unrelated navigation from %s", async (url, sourceUrl) => {
    getFrame.mockResolvedValue({ url: sourceUrl });
    created({ url, sourceTabId: 101, sourceFrameId: 0, tabId: 202 });
    await completed({ tabId: 202, frameId: 0 });
    expect(updateTab).not.toHaveBeenCalled();
    expect(removeTab).not.toHaveBeenCalled();
});

test("ignores subframe completion and clears tracking when the user closes a tab", async () => {
    session["quest-set-tab-202"] = { sourceTabId: 101 };
    await completed({ tabId: 202, frameId: 1 });
    expect(removeTab).not.toHaveBeenCalled();
    await removed(202);
    expect(session).toEqual({});
});
