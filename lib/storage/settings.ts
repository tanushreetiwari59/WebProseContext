import { browser } from 'wxt/browser';
import { DEFAULT_SETTINGS, type AppSettings } from '@/types/settings';

const SETTINGS_KEY = 'webprose.settings';

export async function getSettings(): Promise<AppSettings> {
  const stored = await browser.storage.local.get(SETTINGS_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...(stored[SETTINGS_KEY] as Partial<AppSettings> | undefined),
  };
}

export async function setSettings(settings: AppSettings): Promise<void> {
  // API keys are stored in chrome.storage.local as local plaintext.
  // Future hardening should add OS-backed encryption when extension APIs allow it.
  await browser.storage.local.set({
    [SETTINGS_KEY]: settings,
  });
}
