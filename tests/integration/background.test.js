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
let createTab;
let alarm;
let navigationError;

beforeEach(async () => {
    vi.resetModules();
    updateTab = vi.fn().mockResolvedValue({});
    updateWindow = vi.fn().mockResolvedValue({});
    removeTab = vi.fn().mockResolvedValue();
    notifyTab = vi.fn().mockResolvedValue({ ok: true });
    createTab = vi.fn().mockResolvedValue({ id: 202 });
    getFrame = vi.fn().mockResolvedValue({ url: "https://www.gwars.io/ops.php" });
    session = {};
    const alarms = new Map();
    vi.stubGlobal("chrome", {
        runtime: { onMessage: { addListener: (callback) => { listener = callback; } } },
        tabs: { create: createTab, update: updateTab, remove: removeTab, sendMessage: notifyTab,
            onRemoved: { addListener: (callback) => { removed = callback; } } },
        windows: { update: updateWindow },
        webNavigation: {
            getFrame,
            onCreatedNavigationTarget: { addListener: (callback) => { created = callback; } },
            onCompleted: { addListener: (callback) => { completed = callback; } },
            onErrorOccurred: { addListener: (callback) => { navigationError = callback; } },
        },
        alarms: {
            create: vi.fn(async (name, options) => alarms.set(name, { scheduledTime: options.when ?? Date.now() + options.delayInMinutes * 60000 })),
            get: vi.fn(async (name) => alarms.get(name)),
            clear: vi.fn(async (name) => alarms.delete(name)),
            onAlarm: { addListener: (callback) => { alarm = callback; } } },
        storage: { session: {
            set: vi.fn(async (values) => Object.assign(session, values)),
            get: vi.fn(async (key) => ({ [key]: session[key] })),
            remove: vi.fn(async (key) => { delete session[key]; }),
        } },
    });
    await import("../../src/assets/background.js");
});

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

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

const realtySender = { url: 'https://www.gwars.io/info.realty.php?id=1736883',
    tab: { id: 101, windowId: 7 }, frameId: 0 };
const shopSender = { url: 'https://www.gwars.io/objectedit.php?id=118340',
    tab: { id: 202, windowId: 7 }, frameId: 0 };
async function shopMessage(message, sender = realtySender) {
    if (message.type === 'shop-bump-ready') message = { propertyId: '118340', ...message };
    const respond = vi.fn();
    listener(message, sender, respond);
    await vi.waitFor(() => expect(respond).toHaveBeenCalledOnce());
    return respond.mock.calls[0][0];
}

test('creates an inactive shop tab and runs the bump only after content-script readiness', async () => {
    expect(await shopMessage({ type: 'open-shop-bump', propertyId: '118340', runId: 'run-1' })).toEqual({ ok: true });
    expect(createTab).toHaveBeenCalledExactlyOnceWith({ url: 'about:blank', active: false, windowId: 7 });
    expect(updateTab).toHaveBeenCalledExactlyOnceWith(202, { url: 'https://www.gwars.io/objectedit.php?id=118340' });
    expect(notifyTab).not.toHaveBeenCalled();
    expect(updateWindow).not.toHaveBeenCalled();
    expect(session['active-shop-bump'].phase).toBe('loading');
    expect(await shopMessage({ type: 'open-shop-bump', propertyId: '101661', runId: 'run-2' })).toMatchObject({ ok: false });
    expect(createTab).toHaveBeenCalledOnce();
    await shopMessage({ type: 'shop-bump-ready', available: true, result: null }, shopSender);
    expect(notifyTab).toHaveBeenCalledExactlyOnceWith(202, { type: 'run-shop-bump' });
    expect(session['active-shop-bump'].phase).toBe('running');
    expect(removeTab).not.toHaveBeenCalled();
});

test('unchanged shop result closes the tab without a save navigation and permits the next shop', async () => {
    await shopMessage({ type: 'open-shop-bump', propertyId: '118340', runId: 'run-1' });
    await shopMessage({ type: 'shop-bump-ready', available: true }, shopSender);
    const result = { ok: true, changes: [] };
    await shopMessage({ type: 'shop-bump-ready', available: true, result }, shopSender);
    expect(removeTab).toHaveBeenCalledExactlyOnceWith(202);
    expect(notifyTab).toHaveBeenLastCalledWith(101, { type: 'realty-shop-bump-result', runId: 'run-1', result });
    expect(session).toEqual({});
    expect(await shopMessage({ type: 'open-shop-bump', propertyId: '101661', runId: 'run-2' })).toEqual({ ok: true });
});

test('waits for confirmed saved prices across a worker restart, closes the child, and returns changes', async () => {
    await shopMessage({ type: 'open-shop-bump', propertyId: '118340', runId: 'run-1' });
    await shopMessage({ type: 'shop-bump-ready', available: true }, shopSender);
    vi.resetModules();
    await import('../../src/assets/background.js');
    const result = { ok: true, changes: [{ item: 'Mask', from: 110000, to: 99990, seller: 'Competitor' }] };
    // The native form posts to /objectedit.php; its returned URL has no ?id.
    await shopMessage({ type: 'shop-bump-ready', available: true, result },
        { ...shopSender, url: 'https://www.gwars.io/objectedit.php' });
    expect(removeTab).toHaveBeenCalledExactlyOnceWith(202);
    expect(notifyTab).toHaveBeenLastCalledWith(101, { type: 'realty-shop-bump-result', runId: 'run-1', result });
    expect(notifyTab.mock.invocationCallOrder.at(-1)).toBeGreaterThan(removeTab.mock.invocationCallOrder[0]);
    expect(session).toEqual({});
    expect(await shopMessage({ type: 'open-shop-bump', propertyId: '101661', runId: 'run-2' })).toEqual({ ok: true });
});

test.each(['unavailable', 'unconfirmed', 'lookup', 'closed', 'timeout', 'navigation'])(
    'reports %s shop failure without hanging the queue', async (failure) => {
        await shopMessage({ type: 'open-shop-bump', propertyId: '118340', runId: 'run-1' });
        if (failure === 'unavailable') await shopMessage({ type: 'shop-bump-ready', available: false }, shopSender);
        if (failure === 'unconfirmed') {
            await shopMessage({ type: 'shop-bump-ready', available: true }, shopSender);
            await shopMessage({ type: 'shop-bump-ready', available: true, result: null }, shopSender);
        }
        if (failure === 'lookup') await shopMessage({ type: 'shop-bump-failed', error: 'Lookup failed' }, shopSender);
        if (failure === 'closed') await removed(202);
        if (failure === 'timeout') await alarm({ name: 'active-shop-bump' });
        if (failure === 'navigation') await navigationError({ tabId: 202, frameId: 0 });
        expect(notifyTab).toHaveBeenLastCalledWith(101, {
            type: 'realty-shop-bump-result', runId: 'run-1', result: { ok: false, error: expect.any(String) },
        });
        expect(session).toEqual({});
    }
);

test('ignores unrelated tabs and rejects arbitrary URLs or property ids', async () => {
    expect(await shopMessage({ type: 'open-shop-bump', propertyId: '../ops.php', runId: 'run' })).toMatchObject({ ok: false });
    expect(await shopMessage({ type: 'open-shop-bump', propertyId: '118340', runId: 'run' },
        { ...realtySender, url: 'https://example.com/info.realty.php' })).toMatchObject({ ok: false });
    expect(createTab).not.toHaveBeenCalled();
    await shopMessage({ type: 'open-shop-bump', propertyId: '118340', runId: 'run' });
    await shopMessage({ type: 'shop-bump-ready', available: true }, { ...shopSender, tab: { id: 999 } });
    expect(notifyTab).not.toHaveBeenCalled();
    expect(removeTab).not.toHaveBeenCalled();
});

test('relays item progress only from the running shop without completing or closing it', async () => {
    await shopMessage({ type: 'open-shop-bump', propertyId: '118340', runId: 'run-1' });
    const message = { type: 'shop-bump-progress', propertyId: '118340', progress: { checked: 3, total: 7 } };
    expect(await shopMessage(message, shopSender)).toEqual({ ok: false });
    await shopMessage({ type: 'shop-bump-ready', available: true }, shopSender);
    expect(await shopMessage(message, shopSender)).toEqual({ ok: true });
    expect(notifyTab).toHaveBeenLastCalledWith(101, {
        type: 'realty-shop-bump-progress', runId: 'run-1', progress: { checked: 3, total: 7 },
    });
    expect(removeTab).not.toHaveBeenCalled();
    expect(session['active-shop-bump'].phase).toBe('running');
    const calls = notifyTab.mock.calls.length;
    expect(await shopMessage({ ...message, propertyId: '999' }, shopSender)).toEqual({ ok: false });
    expect(await shopMessage({ ...message, progress: { checked: 8, total: 7 } }, shopSender)).toEqual({ ok: false });
    expect(notifyTab).toHaveBeenCalledTimes(calls);
});

test('continuous bump uses recurring alarms, survives worker restart, and can be stopped', async () => {
    vi.useFakeTimers();
    expect(await shopMessage({ type: 'start-continuous-shop-bump', minutes: 5, nightTimeUpdate: false })).toEqual({ ok: true, nextRunAt: expect.any(Number) });
    expect(chrome.alarms.create).toHaveBeenCalledWith('continuous-shop-bump-101', {
        delayInMinutes: expect.closeTo(5, 2), periodInMinutes: 5,
    });
    vi.resetModules();
    await import('../../src/assets/background.js');
    await alarm({ name: 'continuous-shop-bump-101' });
    expect(notifyTab).toHaveBeenCalledExactlyOnceWith(101, { type: 'continuous-shop-bump-tick', nextRunAt: expect.any(Number) });
    expect(await shopMessage({ type: 'start-continuous-shop-bump', minutes: 2, nightTimeUpdate: false })).toEqual({ ok: true, nextRunAt: expect.any(Number) });
    expect(chrome.alarms.create).toHaveBeenLastCalledWith('continuous-shop-bump-101', {
        delayInMinutes: expect.closeTo(2, 2), periodInMinutes: 2,
    });
    expect(await shopMessage({ type: 'stop-continuous-shop-bump' })).toEqual({ ok: true });
    expect(chrome.alarms.clear).toHaveBeenCalledWith('continuous-shop-bump-101');
    expect(session).toEqual({});
});

test.each([
    [14, 59, true, 5], [15, 0, true, 10], [20, 59, true, 10],
    [21, 0, true, 5], [16, 0, false, 5],
])('local time %s:%s with night mode %s schedules %s minutes', async (hour, minute, enabled, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 4, hour, minute));
    const result = await shopMessage({ type: 'start-continuous-shop-bump', minutes: 5, nightTimeUpdate: enabled });
    expect(result.nextRunAt).toBe(session['continuous-shop-bump-101'].lastRunAt + expected * 60000);
    expect(chrome.alarms.create).toHaveBeenCalledWith('continuous-shop-bump-101', {
        delayInMinutes: expect.closeTo(expected, 2), periodInMinutes: expected,
    });
});

test.each([[14, 15, 10], [20, 21, 5]])('boundary at %s changes the pending interval without starting a run', async (hour, boundaryHour, minutes) => {
    vi.useFakeTimers();
    const startedAt = new Date(2026, 9, 4, hour, 58).getTime();
    vi.setSystemTime(startedAt);
    await shopMessage({ type: 'start-continuous-shop-bump', minutes: 5 });
    expect(session['continuous-shop-bump-101'].nightTimeUpdate).toBe(true);
    expect(chrome.alarms.create).toHaveBeenCalledWith('continuous-shop-bump-boundary-101', {
        when: new Date(2026, 9, 4, boundaryHour).getTime(),
    });
    vi.setSystemTime(new Date(2026, 9, 4, boundaryHour));
    await alarm({ name: 'continuous-shop-bump-boundary-101' });
    expect(notifyTab).toHaveBeenCalledExactlyOnceWith(101, {
        type: 'continuous-shop-bump-schedule', nextRunAt: startedAt + minutes * 60000,
    });
    expect(createTab).not.toHaveBeenCalled();
    vi.setSystemTime(startedAt + minutes * 60000);
    await alarm({ name: 'continuous-shop-bump-101' });
    expect(notifyTab).toHaveBeenLastCalledWith(101, {
        type: 'continuous-shop-bump-tick', nextRunAt: Date.now() + minutes * 60000,
    });
    await shopMessage({ type: 'stop-continuous-shop-bump' });
    expect(chrome.alarms.clear).toHaveBeenCalledWith('continuous-shop-bump-boundary-101');
});

test.each([0, -1, 1.5, NaN])('rejects invalid continuous interval %s', async (minutes) => {
    expect(await shopMessage({ type: 'start-continuous-shop-bump', minutes })).toMatchObject({ ok: false });
    expect(chrome.alarms.create).not.toHaveBeenCalled();
    expect(session).toEqual({});
});

test.each(['closed', 'unavailable', 'inactive'])('clears recurring alarms when the source is %s', async (state) => {
    await shopMessage({ type: 'start-continuous-shop-bump', minutes: 5 });
    if (state === 'closed') await removed(101);
    else {
        if (state === 'unavailable') notifyTab.mockRejectedValue(new Error('No receiver'));
        else notifyTab.mockResolvedValue({ ok: false });
        await alarm({ name: 'continuous-shop-bump-101' });
    }
    expect(chrome.alarms.clear).toHaveBeenCalledWith('continuous-shop-bump-101');
    expect(session).toEqual({});
});
