chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (['start-continuous-shop-bump', 'stop-continuous-shop-bump'].includes(message?.type)) {
        handleContinuousBump(message, sender).then(sendResponse,
            (error) => sendResponse({ ok: false, error: error.message }));
        return true;
    }
    if (['open-shop-bump', 'shop-bump-ready', 'shop-bump-failed', 'shop-bump-progress'].includes(message?.type)) {
        handleShopBumpMessage(message, sender).then(sendResponse,
            (error) => sendResponse({ ok: false, error: error.message }));
        return true;
    }
    if (message?.type !== 'reactivate-realty-tab') {
        return;
    }
    if (!Number.isInteger(sender.tab?.id)) {
        sendResponse({ ok: false });
        return;
    }
    // Use the sender's tab, never a caller-supplied id. Changing activation
    // and window focus leaves the existing document and URL untouched.
    chrome.tabs.update(sender.tab.id, { active: true })
        .then(() => chrome.windows.update(sender.tab.windowId, { focused: true }))
        .then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
    return true;
});

const questRegistrations = new Map();
const questKey = (tabId) => `quest-set-tab-${tabId}`;

chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
    const target = new URL(details.url);
    if (target.protocol !== 'https:' ||
        !(target.hostname === 'gwars.io' || target.hostname.endsWith('.gwars.io')) ||
        target.pathname !== '/home.do.php' || !['7', '2'].includes(target.searchParams.get('putset'))) {
        return;
    }
    const registration = (async () => {
        const source = await chrome.webNavigation.getFrame({
            tabId: details.sourceTabId, frameId: details.sourceFrameId,
        });
        if (!source?.url) return;
        const sourceUrl = new URL(source.url);
        if (sourceUrl.origin !== target.origin ||
            !['/ops.php', '/questlog.php'].includes(sourceUrl.pathname)) return;
        await chrome.storage.session.set({
            [questKey(details.tabId)]: {
                sourceTabId: details.sourceTabId, setId: target.searchParams.get('putset'),
            },
        });
    })();
    questRegistrations.set(details.tabId, registration);
    registration.catch((error) => console.error('Could not track quest-set tab', error))
        .finally(() => questRegistrations.delete(details.tabId));
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId !== 0) return;
    const key = questKey(details.tabId);
    try {
        // Wait if a fast navigation completes while its source is being checked.
        await questRegistrations.get(details.tabId);
        const stored = await chrome.storage.session.get(key);
        const action = stored[key];
        if (!action) return;
        const sourceTab = await chrome.tabs.update(action.sourceTabId, { active: true });
        await chrome.windows.update(sourceTab.windowId, { focused: true });
        await chrome.tabs.sendMessage(action.sourceTabId, {
            type: 'equipment-set-completed', setId: action.setId,
        });
        await chrome.storage.session.remove(key);
    } catch (error) {
        console.error('Could not return from quest-set tab', error);
    }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    await clearContinuousBump(tabId);
    await chrome.storage.session.remove(questKey(tabId));
    const { [shopBumpKey]: action } = await chrome.storage.session.get(shopBumpKey);
    if (action?.tabId === tabId) await finishShopBump(action, { ok: false, error: 'Shop tab was closed' });
    else if (action?.sourceTabId === tabId) {
        await chrome.storage.session.remove(shopBumpKey);
        await chrome.alarms.clear(shopBumpKey);
        await chrome.tabs.remove(action.tabId).catch(() => {});
    }
});

const shopBumpKey = 'active-shop-bump';
const continuousBumpKey = (tabId) => `continuous-shop-bump-${tabId}`;
const continuousBoundaryKey = (tabId) => `continuous-shop-bump-boundary-${tabId}`;
let openingShop = false;
const finishingShopTabs = new Set();
const gameUrl = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' &&
            (parsed.hostname === 'gwars.io' || parsed.hostname.endsWith('.gwars.io')) ? parsed : null;
    } catch { return null; }
};

async function clearContinuousBump(tabId) {
    const key = continuousBumpKey(tabId);
    await chrome.storage.session.remove(key);
    await chrome.alarms.clear(key);
    await chrome.alarms.clear(continuousBoundaryKey(tabId));
}

async function scheduleContinuousBump(action) {
    const now = new Date();
    const hour = now.getHours();
    const minutes = action.nightTimeUpdate && hour >= 15 && hour < 21 ? action.minutes * 2 : action.minutes;
    const lastRunAt = Number.isFinite(action.lastRunAt) ? action.lastRunAt : now.getTime();
    const nextRunAt = Math.max(now.getTime() + 1, lastRunAt + minutes * 60000);
    await chrome.alarms.create(continuousBumpKey(action.sourceTabId), {
        delayInMinutes: (nextRunAt - now.getTime()) / 60000, periodInMinutes: minutes,
    });
    const boundaryKey = continuousBoundaryKey(action.sourceTabId);
    if (action.nightTimeUpdate) {
        const boundary = new Date(now);
        boundary.setHours(hour < 15 ? 15 : hour < 21 ? 21 : 15, 0, 0, 0);
        if (hour >= 21) boundary.setDate(boundary.getDate() + 1);
        await chrome.alarms.create(boundaryKey, { when: boundary.getTime() });
    } else await chrome.alarms.clear(boundaryKey);
    const alarm = await chrome.alarms.get(continuousBumpKey(action.sourceTabId));
    return alarm?.scheduledTime ?? nextRunAt;
}

async function handleContinuousBump(message, sender) {
    const source = gameUrl(sender.url || sender.tab?.url);
    if (!source || source.pathname !== '/info.realty.php' ||
        !Number.isInteger(sender.tab?.id) || (sender.frameId ?? 0) !== 0) {
        return { ok: false, error: 'Invalid continuous bump source' };
    }
    const key = continuousBumpKey(sender.tab.id);
    if (message.type === 'stop-continuous-shop-bump') {
        await clearContinuousBump(sender.tab.id);
    } else {
        if (!Number.isInteger(message.minutes) || message.minutes < 1) {
            return { ok: false, error: 'Bump interval must be a whole number of minutes, at least 1' };
        }
        const action = { sourceTabId: sender.tab.id, minutes: message.minutes,
            nightTimeUpdate: message.nightTimeUpdate !== false, lastRunAt: Date.now() };
        await chrome.storage.session.set({ [key]: action });
        // Chrome alarms keep working when the property-list tab is inactive.
        return { ok: true, nextRunAt: await scheduleContinuousBump(action) };
    }
    return { ok: true };
}

async function finishShopBump(action, result) {
    if (finishingShopTabs.has(action.tabId)) return;
    finishingShopTabs.add(action.tabId);
    try {
        const stored = await chrome.storage.session.get(shopBumpKey);
        if (stored[shopBumpKey]?.runId !== action.runId) return;
        await chrome.storage.session.remove(shopBumpKey);
        await chrome.alarms.clear(shopBumpKey);
        // Close only the background tab created for this action, before notifying
        // the source page that it may open the next property.
        await chrome.tabs.remove(action.tabId).catch(() => {});
        await chrome.tabs.sendMessage(action.sourceTabId, {
            type: 'realty-shop-bump-result', runId: action.runId, result,
        }).catch(() => {});
    } finally { finishingShopTabs.delete(action.tabId); }
}

async function handleShopBumpMessage(message, sender) {
    const source = gameUrl(sender.url || sender.tab?.url);
    if (!source || !Number.isInteger(sender.tab?.id) || (sender.frameId ?? 0) !== 0) {
        return { ok: false, error: 'Invalid shop action source' };
    }
    if (message.type === 'open-shop-bump') {
        if (source.pathname !== '/info.realty.php' || !/^\d+$/.test(message.propertyId) ||
            typeof message.runId !== 'string' || message.runId.length > 100) {
            return { ok: false, error: 'Invalid shop property' };
        }
        if (openingShop) return { ok: false, error: 'Another shop update is running' };
        openingShop = true;
        let tab;
        try {
            const stored = await chrome.storage.session.get(shopBumpKey);
            if (stored[shopBumpKey]) return { ok: false, error: 'Another shop update is running' };
            // Register the tab before navigating so a fast content script cannot
            // announce readiness before its ownership is recorded.
            tab = await chrome.tabs.create({ url: 'about:blank', active: false, windowId: sender.tab.windowId });
            const action = { tabId: tab.id, sourceTabId: sender.tab.id, origin: source.origin,
                propertyId: message.propertyId, runId: message.runId, phase: 'loading' };
            await chrome.storage.session.set({ [shopBumpKey]: action });
            await chrome.alarms.create(shopBumpKey, { delayInMinutes: 15 });
            await chrome.tabs.update(tab.id, { url: `${source.origin}/objectedit.php?id=${message.propertyId}` });
            return { ok: true };
        } catch (error) {
            if (tab) {
                await chrome.storage.session.remove(shopBumpKey);
                await chrome.alarms.clear(shopBumpKey);
                await chrome.tabs.remove(tab.id).catch(() => {});
            }
            throw error;
        } finally { openingShop = false; }
    }
    const { [shopBumpKey]: action } = await chrome.storage.session.get(shopBumpKey);
    if (!action || action.tabId !== sender.tab.id || action.origin !== source.origin) return { ok: false };
    if (message.type === 'shop-bump-progress') {
        const { checked, total } = message.progress || {};
        if (action.phase !== 'running' || message.propertyId !== action.propertyId ||
            !Number.isInteger(checked) || !Number.isInteger(total) || checked < 0 || total < checked) {
            return { ok: false };
        }
        await chrome.tabs.sendMessage(action.sourceTabId, {
            type: 'realty-shop-bump-progress', runId: action.runId, progress: { checked, total },
        }).catch(() => {});
        return { ok: true };
    }
    if (message.type === 'shop-bump-failed') {
        await finishShopBump(action, { ok: false, error: message.error || 'Shop update failed' });
        return { ok: true };
    }
    if (action.phase === 'running') {
        const sameShop = source.pathname === '/objectedit.php' && message.propertyId === action.propertyId;
        await finishShopBump(action, sameShop && message.result ? message.result :
            { ok: false, error: 'The shop save could not be confirmed' });
    } else if (!message.available || source.pathname !== '/objectedit.php' ||
        message.propertyId !== action.propertyId) {
        await finishShopBump(action, { ok: false, error: 'Bump prices is unavailable on this page' });
    } else {
        action.phase = 'running';
        await chrome.storage.session.set({ [shopBumpKey]: action });
        try {
            const started = await chrome.tabs.sendMessage(action.tabId, { type: 'run-shop-bump' });
            if (!started?.ok) throw new Error(started?.error || 'Could not start shop update');
        } catch (error) {
            await finishShopBump(action, { ok: false, error: error.message });
        }
    }
    return { ok: true };
}

chrome.alarms?.onAlarm.addListener(async (alarm) => {
    if (alarm.name.startsWith('continuous-shop-bump-')) {
        const boundary = alarm.name.startsWith('continuous-shop-bump-boundary-');
        const key = boundary ? alarm.name.replace('continuous-shop-bump-boundary-', 'continuous-shop-bump-') : alarm.name;
        const stored = await chrome.storage.session.get(key);
        const action = stored[key];
        if (!action) {
            await chrome.alarms.clear(alarm.name);
            return;
        }
        try {
            if (!boundary) {
                action.lastRunAt = Date.now();
                await chrome.storage.session.set({ [key]: action });
            }
            const nextRunAt = await scheduleContinuousBump(action);
            const response = await chrome.tabs.sendMessage(action.sourceTabId, {
                type: boundary ? 'continuous-shop-bump-schedule' : 'continuous-shop-bump-tick', nextRunAt,
            });
            if (!response?.ok) await clearContinuousBump(action.sourceTabId);
        } catch {
            await clearContinuousBump(action.sourceTabId);
        }
        return;
    }
    if (alarm.name !== shopBumpKey) return;
    const { [shopBumpKey]: action } = await chrome.storage.session.get(shopBumpKey);
    if (action) await finishShopBump(action, { ok: false, error: 'Shop update timed out' });
});

chrome.webNavigation.onErrorOccurred?.addListener(async (details) => {
    if (details.frameId !== 0) return;
    const { [shopBumpKey]: action } = await chrome.storage.session.get(shopBumpKey);
    if (action?.tabId === details.tabId) await finishShopBump(action, { ok: false, error: 'Could not load the shop page' });
});
