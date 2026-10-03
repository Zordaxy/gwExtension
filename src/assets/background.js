chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.session.remove(questKey(tabId));
});
