import { browser } from 'wxt/browser';

export async function openSettingsPage(): Promise<void> {
  await browser.tabs.create({
    url: browser.runtime.getURL('/options.html'),
  });
}
