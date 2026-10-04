import { ShopBump } from './shopBump';

// The background worker owns tab tracking; this bridge only invokes the same
// handler as a manual bump and reports the result confirmed after navigation.
export const ShopBumpBridge = {
  init() {
    if (!globalThis.chrome?.runtime?.onMessage) return;
    ShopBump.onProgress = (progress) => {
      chrome.runtime.sendMessage({ type: 'shop-bump-progress',
        propertyId: ShopBump.propertyId, progress }).catch(() => {});
    };
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== 'run-shop-bump') return;
      const button = document.querySelector('[data-test-bump-prices]');
      if (!button || button.disabled) {
        sendResponse({ ok: false, error: 'Bump prices is unavailable on this page' });
        return;
      }
      sendResponse({ ok: true });
      // Space the first market request from the tab's edit-page navigation.
      Promise.resolve().then(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const result = await button.onclick();
        if (result?.ok !== true) throw new Error(result?.error || 'Could not start price update');
        if (!result.saving) {
          // An unchanged shop finishes without navigation; report it now.
          await chrome.runtime.sendMessage({ type: 'shop-bump-ready',
            propertyId: ShopBump.propertyId, available: true, result });
        }
      }).catch((error) => {
        chrome.runtime.sendMessage({ type: 'shop-bump-failed', error: error.message }).catch(() => {});
      });
    });
    chrome.runtime.sendMessage({
      type: 'shop-bump-ready',
      propertyId: ShopBump.propertyId,
      available: !!document.querySelector('[data-test-bump-prices]'),
      result: ShopBump.lastResult,
    }).catch(() => {});
  },
};
