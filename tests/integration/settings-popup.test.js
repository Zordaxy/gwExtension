import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';

let values;
let write;
beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  document.body.innerHTML = fs.readFileSync(path.resolve(__dirname, '../../src/assets/popup.html'), 'utf8');
  values = {};
  write = vi.fn(async (update) => Object.assign(values, update));
  vi.stubGlobal('chrome', { storage: { local: {
    get: vi.fn(async () => values), set: write,
  } } });
  await import('../../src/popup.js');
  await vi.runAllTimersAsync();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('defaults the continuous interval to five minutes and persists edits', async () => {
  const interval = document.querySelector('[name="shopBumpIntervalMinutes"]');
  expect(interval.value).toBe('5');
  interval.value = '2';
  fireEvent.submit(document.getElementById('settings'));
  await vi.runAllTimersAsync();
  expect(write).toHaveBeenCalledOnce();
  expect(values.gwSettings.shopBumpIntervalMinutes).toBe(2);
});

test('night time update defaults on, persists disabling, and resets on', async () => {
  const checkbox = document.querySelector('[name="nightTimeUpdate"]');
  expect(checkbox.checked).toBe(true);
  checkbox.checked = false;
  fireEvent.submit(document.getElementById('settings'));
  await vi.runAllTimersAsync();
  expect(values.gwSettings.nightTimeUpdate).toBe(false);
  fireEvent.click(document.getElementById('reset'));
  await vi.runAllTimersAsync();
  expect(values.gwSettings.nightTimeUpdate).toBe(true);
  expect(checkbox.checked).toBe(true);
});

test('friends editor persists trimmed unique player names and restores them when reopened', async () => {
  const friends = document.querySelector('[name="friends"]');
  expect(friends.value).toBe('');
  friends.value = '  cyberkid  \nДоменатор\n\ncyberkid\nSeller With Spaces';
  fireEvent.submit(document.getElementById('settings'));
  await vi.runAllTimersAsync();
  expect(values.gwSettings.friends).toEqual(['cyberkid', 'Доменатор', 'Seller With Spaces']);
  vi.resetModules();
  document.body.innerHTML = fs.readFileSync(path.resolve(__dirname, '../../src/assets/popup.html'), 'utf8');
  await import('../../src/popup.js');
  await vi.runAllTimersAsync();
  expect(document.querySelector('[name="friends"]').value).toBe('cyberkid\nДоменатор\nSeller With Spaces');
});

test('friends list may be emptied and resets to the default', async () => {
  document.querySelector('[name="friends"]').value = '';
  fireEvent.submit(document.getElementById('settings'));
  await vi.runAllTimersAsync();
  const { mergeOverrides } = await import('js/settingsConfig');
  expect(mergeOverrides(values.gwSettings).friends).toEqual([]);
  fireEvent.click(document.getElementById('reset'));
  await vi.runAllTimersAsync();
  expect(values.gwSettings.friends).toEqual([]);
  expect(document.querySelector('[name="friends"]').value).toBe('');
});

test('content settings load the friends array and apply edits without reloading', async () => {
  values.gwSettings = { friends: ['cyberkid', 'Доменатор'] };
  let changed;
  chrome.storage.onChanged = { addListener: (handler) => { changed = handler; } };
  const { Settings } = await import('js/settings');
  await Settings.load();
  expect(Settings.friends).toEqual(['cyberkid', 'Доменатор']);
  changed({ gwSettings: { newValue: { friends: ['BSAU'] } } }, 'local');
  expect(Settings.friends).toEqual(['BSAU']);
});

test.each(['', '0', '-1', '1.5'])('invalid interval %s retains the previous saved interval', async (value) => {
  values.gwSettings = { shopBumpIntervalMinutes: 3 };
  document.querySelector('[name="shopBumpIntervalMinutes"]').value = value;
  fireEvent.submit(document.getElementById('settings'));
  await vi.runAllTimersAsync();
  expect(values.gwSettings.shopBumpIntervalMinutes).toBe(3);
});
